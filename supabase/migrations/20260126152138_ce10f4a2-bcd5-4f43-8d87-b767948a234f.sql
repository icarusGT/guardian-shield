-- Fix the type mismatch: cast varchar columns to text in the function
CREATE OR REPLACE FUNCTION public.get_case_reporter(p_case_id bigint)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins / auditors can view
  IF public.is_admin() OR public.is_auditor() THEN
    RETURN QUERY
      SELECT u.user_id, u.full_name::text, u.email::text
      FROM public.fraud_cases fc
      JOIN public.customers c ON c.customer_id = fc.customer_id
      JOIN public.users u ON u.user_id = c.user_id
      WHERE fc.case_id = p_case_id;
    RETURN;
  END IF;

  -- Assigned investigators can view
  IF public.is_investigator() AND public.user_is_assigned_investigator(p_case_id) THEN
    RETURN QUERY
      SELECT u.user_id, u.full_name::text, u.email::text
      FROM public.fraud_cases fc
      JOIN public.customers c ON c.customer_id = fc.customer_id
      JOIN public.users u ON u.user_id = c.user_id
      WHERE fc.case_id = p_case_id;
    RETURN;
  END IF;

  -- Case owner (customer) can view
  IF public.is_customer() AND EXISTS (
    SELECT 1
    FROM public.fraud_cases fc
    JOIN public.customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = p_case_id
      AND c.user_id = auth.uid()
  ) THEN
    RETURN QUERY
      SELECT u.user_id, u.full_name::text, u.email::text
      FROM public.fraud_cases fc
      JOIN public.customers c ON c.customer_id = fc.customer_id
      JOIN public.users u ON u.user_id = c.user_id
      WHERE fc.case_id = p_case_id;
    RETURN;
  END IF;

  -- Otherwise: no rows
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.get_case_reporter(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_case_reporter(bigint) TO authenticated;