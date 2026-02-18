
-- Create case_ratings table
CREATE TABLE public.case_ratings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id bigint NOT NULL REFERENCES public.fraud_cases(case_id),
  investigator_id bigint NOT NULL REFERENCES public.investigators(investigator_id),
  customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_comment text DEFAULT NULL,
  flagged_for_review boolean NOT NULL DEFAULT false,
  skipped_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_ratings ENABLE ROW LEVEL SECURITY;

-- Customer can insert their own rating (once per case)
CREATE POLICY "cr_customer_insert_own"
ON public.case_ratings
FOR INSERT
WITH CHECK (
  is_customer()
  AND user_owns_customer(customer_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.case_ratings cr WHERE cr.case_id = case_ratings.case_id AND cr.customer_id = case_ratings.customer_id
  )
);

-- Customer can read their own ratings
CREATE POLICY "cr_customer_read_own"
ON public.case_ratings
FOR SELECT
USING (is_customer() AND user_owns_customer(customer_id));

-- Admin full access
CREATE POLICY "cr_admin_all"
ON public.case_ratings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Auditor read
CREATE POLICY "cr_auditor_read"
ON public.case_ratings
FOR SELECT
USING (is_auditor());

-- Investigator can read ratings for their own cases
CREATE POLICY "cr_investigator_read_own"
ON public.case_ratings
FOR SELECT
USING (
  is_investigator()
  AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = case_ratings.investigator_id
    AND i.user_id = auth.uid()
  )
);

-- No update or delete for customers (immutable ratings)
-- Admin already has ALL access for management

-- Add index for performance
CREATE INDEX idx_case_ratings_case_id ON public.case_ratings(case_id);
CREATE INDEX idx_case_ratings_investigator_id ON public.case_ratings(investigator_id);
CREATE INDEX idx_case_ratings_created_at ON public.case_ratings(created_at);
