
-- Tighten customer visibility: only COMMUNICATED decisions (not FINAL)
-- Case decisions
DROP POLICY IF EXISTS "cd_customer_read_own" ON public.case_decisions;
CREATE POLICY "cd_customer_read_own"
  ON public.case_decisions
  FOR SELECT
  USING (
    is_customer()
    AND status = 'COMMUNICATED'::decision_status
    AND EXISTS (
      SELECT 1
      FROM fraud_cases fc
      JOIN customers c ON c.customer_id = fc.customer_id
      WHERE fc.case_id = case_decisions.case_id
        AND c.user_id = auth.uid()
    )
  );

-- Transaction decisions
DROP POLICY IF EXISTS "td_customer_read_own" ON public.transaction_decisions;
CREATE POLICY "td_customer_read_own"
  ON public.transaction_decisions
  FOR SELECT
  USING (
    is_customer()
    AND status = 'COMMUNICATED'::decision_status
    AND EXISTS (
      SELECT 1
      FROM transactions t
      JOIN customers c ON c.customer_id = t.customer_id
      WHERE t.txn_id = transaction_decisions.txn_id
        AND c.user_id = auth.uid()
    )
  );
