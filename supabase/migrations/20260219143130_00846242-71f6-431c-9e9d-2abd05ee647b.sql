
-- Drop the recursive policy
DROP POLICY IF EXISTS "ir_customer_insert_own" ON public.investigator_ratings;

-- Create a security definer function to check for existing investigator ratings
CREATE OR REPLACE FUNCTION public.investigator_rating_exists(p_case_id bigint, p_customer_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.investigator_ratings
    WHERE case_id = p_case_id AND customer_id = p_customer_id
  );
$$;

-- Recreate policy without self-reference
CREATE POLICY "ir_customer_insert_own"
ON public.investigator_ratings
FOR INSERT
WITH CHECK (
  is_customer()
  AND user_owns_customer(customer_id)
  AND NOT public.investigator_rating_exists(case_id, customer_id)
);
