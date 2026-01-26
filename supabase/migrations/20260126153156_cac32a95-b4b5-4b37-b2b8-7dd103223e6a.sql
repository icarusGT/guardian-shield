-- Create a secure function to update case status and log to case_history
-- This bypasses RLS restrictions for authorized investigators/admins
CREATE OR REPLACE FUNCTION public.update_case_status(
  p_case_id bigint,
  p_new_status case_status,
  p_comment text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  old_status text,
  new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status case_status;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF public.is_admin() THEN
    -- Admin can update any case
    NULL;
  ELSIF public.is_investigator() THEN
    -- Investigator can only update cases they are assigned to
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
$$;

-- Grant execute to authenticated users (function handles its own authorization)
REVOKE ALL ON FUNCTION public.update_case_status(bigint, case_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_case_status(bigint, case_status, text) TO authenticated;