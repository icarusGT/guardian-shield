
-- Update the RPC to enforce strict one-way transitions:
-- OPEN -> UNDER_INVESTIGATION (investigator only)
-- UNDER_INVESTIGATION -> CLOSED (admin only, requires COMMUNICATED decision)
-- No reverse transitions allowed.
CREATE OR REPLACE FUNCTION public.update_case_status(p_case_id bigint, p_new_status case_status, p_comment text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, old_status text, new_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_old_status case_status;
  v_user_id uuid;
  v_has_communicated boolean;
BEGIN
  v_user_id := auth.uid();

  SELECT status INTO v_old_status
  FROM public.fraud_cases
  WHERE case_id = p_case_id;

  IF v_old_status IS NULL THEN
    RETURN QUERY SELECT false, 'Case not found'::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- No-op
  IF v_old_status = p_new_status THEN
    RETURN QUERY SELECT true, 'Status unchanged'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- CLOSED is terminal — no transitions out
  IF v_old_status = 'CLOSED' THEN
    RETURN QUERY SELECT false, 'Closed cases cannot be reopened or changed'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- UNDER_INVESTIGATION cannot go back to OPEN
  IF v_old_status = 'UNDER_INVESTIGATION' AND p_new_status = 'OPEN' THEN
    RETURN QUERY SELECT false, 'Cannot return to Open once investigation has started'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- Customer: never allowed
  IF public.is_customer() THEN
    RETURN QUERY SELECT false, 'Customers cannot change case status'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- INVESTIGATOR: only OPEN -> UNDER_INVESTIGATION
  IF public.is_investigator() THEN
    IF NOT public.user_is_assigned_investigator(p_case_id) THEN
      RETURN QUERY SELECT false, 'Permission denied: not assigned to this case'::text, NULL::text, NULL::text;
      RETURN;
    END IF;

    IF NOT (v_old_status = 'OPEN' AND p_new_status = 'UNDER_INVESTIGATION') THEN
      RETURN QUERY SELECT false, 'Investigators can only move cases from Open to Under Investigation'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

  -- ADMIN: only UNDER_INVESTIGATION -> CLOSED (with COMMUNICATED decision)
  ELSIF public.is_admin() THEN
    IF p_new_status != 'CLOSED' THEN
      RETURN QUERY SELECT false, 'Admins can only close cases'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

    IF v_old_status != 'UNDER_INVESTIGATION' THEN
      RETURN QUERY SELECT false, 'Can only close cases that are Under Investigation'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.case_decisions
      WHERE case_id = p_case_id AND status = 'COMMUNICATED'
    ) INTO v_has_communicated;

    IF NOT v_has_communicated THEN
      RETURN QUERY SELECT false, 'Cannot close: decision must be communicated first'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

  ELSE
    RETURN QUERY SELECT false, 'Permission denied'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- Execute
  UPDATE public.fraud_cases
  SET status = p_new_status,
      closed_at = CASE WHEN p_new_status = 'CLOSED' THEN now() ELSE closed_at END
  WHERE case_id = p_case_id;

  INSERT INTO public.case_history (case_id, old_status, new_status, changed_by_user, changed_at, comment)
  VALUES (p_case_id, v_old_status, p_new_status, v_user_id, now(), COALESCE(p_comment, 'Status changed'));

  RETURN QUERY SELECT true, 'Status updated successfully'::text, v_old_status::text, p_new_status::text;
END;
$$;
