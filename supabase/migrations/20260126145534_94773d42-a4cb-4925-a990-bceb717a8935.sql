-- Add RLS policy to allow customers to insert case_transactions for their own cases and transactions
CREATE POLICY "ct_customer_insert_own"
ON public.case_transactions
FOR INSERT
WITH CHECK (
  is_customer()
  AND EXISTS (
    SELECT 1 FROM public.fraud_cases fc
    JOIN public.customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = case_transactions.case_id
      AND c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.transactions t
    JOIN public.customers c ON c.customer_id = t.customer_id
    WHERE t.txn_id = case_transactions.txn_id
      AND c.user_id = auth.uid()
  )
);

-- Also allow customers to read their own case_transactions
CREATE POLICY "ct_customer_read_own"
ON public.case_transactions
FOR SELECT
USING (
  is_customer()
  AND EXISTS (
    SELECT 1 FROM public.fraud_cases fc
    JOIN public.customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = case_transactions.case_id
      AND c.user_id = auth.uid()
  )
);