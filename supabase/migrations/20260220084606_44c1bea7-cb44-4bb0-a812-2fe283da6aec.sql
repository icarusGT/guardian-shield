
-- 1. Drop the duplicate history trigger (the RPC handles history insertion)
DROP TRIGGER IF EXISTS trg_case_status_history ON public.fraud_cases;
DROP FUNCTION IF EXISTS public.trg_case_status_history_fn();

-- 2. Rebuild update_case_status with strict role-based rules
CREATE OR REPLACE FUNCTION public.update_case_status(
  p_case_id bigint,
  p_new_status case_status,
  p_comment text DEFAULT NULL::text
)
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

  -- Get the current status
  SELECT status INTO v_old_status
  FROM public.fraud_cases
  WHERE case_id = p_case_id;

  IF v_old_status IS NULL THEN
    RETURN QUERY SELECT false, 'Case not found'::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Block: no-op
  IF v_old_status = p_new_status THEN
    RETURN QUERY SELECT true, 'Status unchanged'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- Block: closed cases cannot be reopened
  IF v_old_status = 'CLOSED' THEN
    RETURN QUERY SELECT false, 'Closed case cannot be reopened'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- ===== CUSTOMER: never allowed =====
  IF public.is_customer() THEN
    RETURN QUERY SELECT false, 'Customers cannot change case status'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- ===== INVESTIGATOR: only OPEN <-> UNDER_INVESTIGATION =====
  IF public.is_investigator() THEN
    IF NOT public.user_is_assigned_investigator(p_case_id) THEN
      RETURN QUERY SELECT false, 'Permission denied: not assigned to this case'::text, NULL::text, NULL::text;
      RETURN;
    END IF;

    -- Only allow toggling between OPEN and UNDER_INVESTIGATION
    IF NOT (
      (v_old_status = 'OPEN' AND p_new_status = 'UNDER_INVESTIGATION') OR
      (v_old_status = 'UNDER_INVESTIGATION' AND p_new_status = 'OPEN')
    ) THEN
      RETURN QUERY SELECT false, 'Investigators can only change status between Open and Under Investigation'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

  -- ===== ADMIN: can only close, and only after COMMUNICATED decision =====
  ELSIF public.is_admin() THEN
    IF p_new_status != 'CLOSED' THEN
      RETURN QUERY SELECT false, 'Admins can only close cases (not change to other statuses)'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

    -- Require a COMMUNICATED decision
    SELECT EXISTS (
      SELECT 1 FROM public.case_decisions
      WHERE case_id = p_case_id
        AND status = 'COMMUNICATED'
    ) INTO v_has_communicated;

    IF NOT v_has_communicated THEN
      RETURN QUERY SELECT false, 'Cannot close: decision must be communicated first'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;

  ELSE
    -- Auditors or unknown roles
    RETURN QUERY SELECT false, 'Permission denied'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- Execute the status change
  UPDATE public.fraud_cases
  SET status = p_new_status,
      closed_at = CASE WHEN p_new_status = 'CLOSED' THEN now() ELSE closed_at END
  WHERE case_id = p_case_id;

  -- Insert exactly ONE history entry
  INSERT INTO public.case_history (case_id, old_status, new_status, changed_by_user, changed_at, comment)
  VALUES (p_case_id, v_old_status, p_new_status, v_user_id, now(), COALESCE(p_comment, 'Status changed'));

  RETURN QUERY SELECT true, 'Status updated successfully'::text, v_old_status::text, p_new_status::text;
END;
$$;

-- 3. Clean up duplicate history rows (keep only the one with the meaningful comment, delete "Status changed" duplicates)
DELETE FROM public.case_history h1
USING public.case_history h2
WHERE h1.case_id = h2.case_id
  AND h1.old_status = h2.old_status
  AND h1.new_status = h2.new_status
  AND h1.changed_at = h2.changed_at
  AND h1.changed_by_user = h2.changed_by_user
  AND h1.comment = 'Status changed'
  AND h2.comment != 'Status changed'
  AND h1.history_id != h2.history_id;

-- 4. Remove bogus "Decision Communicated" entries (same old/new status)
DELETE FROM public.case_history
WHERE old_status = new_status
  AND comment = 'Decision Communicated';
