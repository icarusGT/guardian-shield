-- Fix infinite recursion in RLS policies for case_transactions and transactions.
-- The transactions policy references case_transactions which triggers case_transactions RLS,
-- causing infinite recursion. Fix: use SECURITY DEFINER functions to bypass RLS.

-- 1. Create helper function for transactions investigator check (uses bigint to match column type)
CREATE OR REPLACE FUNCTION public.user_is_assigned_to_case_txn(p_txn_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM case_transactions ct
    JOIN case_assignments ca ON ca.case_id = ct.case_id
    JOIN investigators i ON i.investigator_id = ca.investigator_id
    WHERE ct.txn_id = p_txn_id
      AND i.user_id = auth.uid()
  );
$$;

-- 2. Fix transactions investigator read policy
DROP POLICY IF EXISTS "tx_investigator_assigned_read" ON public.transactions;

CREATE POLICY "tx_investigator_assigned_read" ON public.transactions
FOR SELECT USING (
  is_investigator() AND user_is_assigned_to_case_txn(txn_id)
);

-- 3. Fix case_transactions investigator read policy using existing function
DROP POLICY IF EXISTS "ct_investigator_assigned_read" ON public.case_transactions;

CREATE POLICY "ct_investigator_assigned_read" ON public.case_transactions
FOR SELECT USING (
  is_investigator() AND user_is_assigned_investigator(case_id)
);

-- 4. Fix suspicious_transactions investigator read policy (same recursion issue)
DROP POLICY IF EXISTS "susp_investigator_read" ON public.suspicious_transactions;

CREATE POLICY "susp_investigator_read" ON public.suspicious_transactions
FOR SELECT USING (
  is_investigator() AND user_is_assigned_to_case_txn(txn_id)
);

-- 5. Also add customer read policy for case_history so customers can see status changes
DROP POLICY IF EXISTS "case_history_customer_read_own" ON public.case_history;

CREATE POLICY "case_history_customer_read_own" ON public.case_history
FOR SELECT USING (
  is_customer() AND EXISTS (
    SELECT 1 FROM fraud_cases fc
    JOIN customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = case_history.case_id
      AND c.user_id = auth.uid()
  )
);