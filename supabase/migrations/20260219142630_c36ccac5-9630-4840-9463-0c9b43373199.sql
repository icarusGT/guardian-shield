
-- Drop the recursive policy
DROP POLICY IF EXISTS "cr_customer_insert_own" ON public.case_ratings;

-- Create a security definer function to check for existing ratings
CREATE OR REPLACE FUNCTION public.case_rating_exists(p_case_id bigint, p_customer_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.case_ratings
    WHERE case_id = p_case_id AND customer_id = p_customer_id
  );
$$;

-- Recreate policy without self-reference
CREATE POLICY "cr_customer_insert_own"
ON public.case_ratings
FOR INSERT
WITH CHECK (
  is_customer()
  AND user_owns_customer(customer_id)
  AND NOT public.case_rating_exists(case_id, customer_id)
);
