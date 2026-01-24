-- ==============================================================
-- FIX: Infinite recursion in fraud_cases SELECT policy
-- Cause: fraud_cases SELECT policy referenced case_assignments, while
-- case_assignments customer policy references fraud_cases.
-- This breaks INSERT ... RETURNING (via .insert().select()) for customers.
-- ==============================================================

-- 1) Helper function to check investigator assignment without invoking RLS
CREATE OR REPLACE FUNCTION public.user_is_assigned_investigator(p_case_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.case_assignments ca
    JOIN public.investigators i
      ON i.investigator_id = ca.investigator_id
    WHERE ca.case_id = p_case_id
      AND i.user_id = auth.uid()
  );
$$;

-- 2) Replace recursive policy with function-based policy
DROP POLICY IF EXISTS "cases_investigator_assigned_read" ON public.fraud_cases;

CREATE POLICY "cases_investigator_assigned_read"
ON public.fraud_cases
FOR SELECT
TO authenticated
USING (
  public.is_investigator() AND public.user_is_assigned_investigator(case_id)
);

-- 3) Ensure the customer read policy is scoped to authenticated (avoid public)
-- (Keeps same logic, but removes exposure/odd planner behavior)
DROP POLICY IF EXISTS "cases_customer_own_read" ON public.fraud_cases;
CREATE POLICY "cases_customer_own_read"
ON public.fraud_cases
FOR SELECT
TO authenticated
USING (
  public.is_customer() AND public.user_owns_customer(customer_id)
);

-- 4) Ensure the customer insert policy is scoped to authenticated
DROP POLICY IF EXISTS "cases_customer_own_insert" ON public.fraud_cases;
CREATE POLICY "cases_customer_own_insert"
ON public.fraud_cases
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_customer() AND public.user_owns_customer(customer_id)
);
