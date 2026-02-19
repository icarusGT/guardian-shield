
-- Update the update_case_status RPC function to require a finalized decision before closing
CREATE OR REPLACE FUNCTION public.update_case_status(p_case_id bigint, p_new_status case_status, p_comment text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, old_status text, new_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_status case_status;
  v_user_id uuid;
  v_has_finalized_decision boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Permission checks
  IF public.is_admin() THEN
    NULL;
  ELSIF public.is_investigator() THEN
    IF NOT public.user_is_assigned_investigator(p_case_id) THEN
      RETURN QUERY SELECT false, 'Permission denied: You are not assigned to this case'::text, NULL::text, NULL::text;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT false, 'Permission denied to update case status'::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Get the current status
  SELECT status INTO v_old_status
  FROM public.fraud_cases
  WHERE case_id = p_case_id;

  IF v_old_status IS NULL THEN
    RETURN QUERY SELECT false, 'Case not found'::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Check if trying to reopen a closed case
  IF v_old_status = 'CLOSED' AND p_new_status <> 'CLOSED' THEN
    RETURN QUERY SELECT false, 'Closed case cannot be reopened'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- NEW: Check if trying to close without a finalized decision
  IF p_new_status = 'CLOSED' AND v_old_status <> 'CLOSED' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.case_decisions
      WHERE case_id = p_case_id
        AND status IN ('FINAL', 'COMMUNICATED')
    ) INTO v_has_finalized_decision;

    IF NOT v_has_finalized_decision THEN
      RETURN QUERY SELECT false, 'You must finalize a decision before closing this case.'::text, v_old_status::text, p_new_status::text;
      RETURN;
    END IF;
  END IF;

  -- If same status, no update needed
  IF v_old_status = p_new_status THEN
    RETURN QUERY SELECT true, 'Status unchanged'::text, v_old_status::text, p_new_status::text;
    RETURN;
  END IF;

  -- Update the case status
  UPDATE public.fraud_cases
  SET status = p_new_status,
      closed_at = CASE WHEN p_new_status = 'CLOSED' THEN now() ELSE closed_at END
  WHERE case_id = p_case_id;

  -- Insert into case_history
  INSERT INTO public.case_history (case_id, old_status, new_status, changed_by_user, changed_at, comment)
  VALUES (p_case_id, v_old_status, p_new_status, v_user_id, now(), COALESCE(p_comment, 'Status changed via workflow'));

  RETURN QUERY SELECT true, 'Status updated successfully'::text, v_old_status::text, p_new_status::text;
END;
$function$;

-- Also update the trigger to enforce at the row level (catches direct UPDATEs too)
CREATE OR REPLACE FUNCTION public.trg_case_prevent_reopen_fn()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_has_finalized boolean;
BEGIN
  -- Prevent reopening closed cases
  IF old.status = 'CLOSED' AND new.status <> 'CLOSED' THEN
    RAISE EXCEPTION 'Closed case cannot be reopened.';
  END IF;

  -- Require finalized decision before closing
  IF new.status = 'CLOSED' AND old.status <> 'CLOSED' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.case_decisions
      WHERE case_id = new.case_id
        AND status IN ('FINAL', 'COMMUNICATED')
    ) INTO v_has_finalized;

    IF NOT v_has_finalized THEN
      RAISE EXCEPTION 'You must finalize a decision before closing this case.';
    END IF;

    new.closed_at := now();
  END IF;

  RETURN new;
END;
$function$;
