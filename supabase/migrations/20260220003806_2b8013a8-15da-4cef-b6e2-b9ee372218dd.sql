-- Fix: case_decisions policies are all RESTRICTIVE, which means no rows are returned
-- because PostgreSQL requires at least one PERMISSIVE policy to grant access.
-- Drop and recreate key policies as PERMISSIVE.

DROP POLICY IF EXISTS "cd_admin_all" ON public.case_decisions;
CREATE POLICY "cd_admin_all" ON public.case_decisions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "cd_auditor_read" ON public.case_decisions;
CREATE POLICY "cd_auditor_read" ON public.case_decisions
  FOR SELECT USING (is_auditor());

DROP POLICY IF EXISTS "cd_customer_read_own" ON public.case_decisions;
CREATE POLICY "cd_customer_read_own" ON public.case_decisions
  FOR SELECT USING (
    is_customer() 
    AND status IN ('FINAL', 'COMMUNICATED') 
    AND EXISTS (
      SELECT 1 FROM fraud_cases fc
      JOIN customers c ON c.customer_id = fc.customer_id
      WHERE fc.case_id = case_decisions.case_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cd_investigator_insert" ON public.case_decisions;
CREATE POLICY "cd_investigator_insert" ON public.case_decisions
  FOR INSERT WITH CHECK (is_investigator() AND user_is_assigned_investigator(case_id));

DROP POLICY IF EXISTS "cd_investigator_read" ON public.case_decisions;
CREATE POLICY "cd_investigator_read" ON public.case_decisions
  FOR SELECT USING (is_investigator() AND user_is_assigned_investigator(case_id));

DROP POLICY IF EXISTS "cd_investigator_update_own_draft" ON public.case_decisions;
CREATE POLICY "cd_investigator_update_own_draft" ON public.case_decisions
  FOR UPDATE USING (is_investigator() AND admin_user_id = auth.uid() AND status = 'DRAFT')
  WITH CHECK (is_investigator() AND admin_user_id = auth.uid());