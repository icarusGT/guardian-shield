
-- Create a SECURITY DEFINER function to check if user owns a customer (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_customer(p_customer_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.customer_id = p_customer_id
      AND c.user_id = auth.uid()
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "cases_customer_own_insert" ON public.fraud_cases;
DROP POLICY IF EXISTS "cases_customer_own_read" ON public.fraud_cases;

-- Recreate policies using safe SECURITY DEFINER functions
CREATE POLICY "cases_customer_own_insert"
ON public.fraud_cases
FOR INSERT
WITH CHECK (
  is_customer() AND user_owns_customer(customer_id)
);

CREATE POLICY "cases_customer_own_read"
ON public.fraud_cases
FOR SELECT
USING (
  is_customer() AND user_owns_customer(customer_id)
);
