
-- Create investigator_ratings table with multi-category ratings
CREATE TABLE public.investigator_ratings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id bigint NOT NULL REFERENCES public.fraud_cases(case_id),
  investigator_id bigint NOT NULL REFERENCES public.investigators(investigator_id),
  customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
  overall_rating smallint NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating smallint NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  speed_rating smallint NOT NULL CHECK (speed_rating >= 1 AND speed_rating <= 5),
  professionalism_rating smallint NOT NULL CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  feedback_comment text DEFAULT NULL,
  flagged_for_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(case_id, customer_id)
);

ALTER TABLE public.investigator_ratings ENABLE ROW LEVEL SECURITY;

-- Customer can insert own rating (once per case)
CREATE POLICY "ir_customer_insert_own" ON public.investigator_ratings
  FOR INSERT WITH CHECK (
    is_customer()
    AND user_owns_customer(customer_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.investigator_ratings ir
      WHERE ir.case_id = investigator_ratings.case_id
        AND ir.customer_id = investigator_ratings.customer_id
    )
  );

-- Customer can read own ratings
CREATE POLICY "ir_customer_read_own" ON public.investigator_ratings
  FOR SELECT USING (is_customer() AND user_owns_customer(customer_id));

-- Admin full access
CREATE POLICY "ir_admin_all" ON public.investigator_ratings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Auditor read
CREATE POLICY "ir_auditor_read" ON public.investigator_ratings
  FOR SELECT USING (is_auditor());

-- Investigator can read own ratings
CREATE POLICY "ir_investigator_read_own" ON public.investigator_ratings
  FOR SELECT USING (
    is_investigator()
    AND EXISTS (
      SELECT 1 FROM public.investigators i
      WHERE i.investigator_id = investigator_ratings.investigator_id
        AND i.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_ir_case_id ON public.investigator_ratings(case_id);
CREATE INDEX idx_ir_investigator_id ON public.investigator_ratings(investigator_id);
CREATE INDEX idx_ir_created_at ON public.investigator_ratings(created_at);
