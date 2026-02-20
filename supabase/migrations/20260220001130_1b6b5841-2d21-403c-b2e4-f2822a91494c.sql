
-- Allow investigators assigned to the case to INSERT decisions
CREATE POLICY "cd_investigator_insert"
ON public.case_decisions
FOR INSERT
WITH CHECK (
  is_investigator()
  AND user_is_assigned_investigator(case_id)
);

-- Allow investigators to SELECT decisions for their assigned cases
CREATE POLICY "cd_investigator_read"
ON public.case_decisions
FOR SELECT
USING (
  is_investigator()
  AND user_is_assigned_investigator(case_id)
);

-- Allow investigators to UPDATE only their own DRAFT decisions
CREATE POLICY "cd_investigator_update_own_draft"
ON public.case_decisions
FOR UPDATE
USING (
  is_investigator()
  AND admin_user_id = auth.uid()
  AND status = 'DRAFT'
)
WITH CHECK (
  is_investigator()
  AND admin_user_id = auth.uid()
);
