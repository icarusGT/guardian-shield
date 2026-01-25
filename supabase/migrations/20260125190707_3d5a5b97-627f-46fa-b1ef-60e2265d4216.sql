-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create feedback categories enum
CREATE TYPE public.feedback_category AS ENUM (
  'CONFIRMED_FRAUD',
  'FALSE_POSITIVE', 
  'REQUIRES_MORE_INFO',
  'ESCALATE_TO_ADMIN',
  'UNDER_REVIEW'
);

-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ESCALATED'
);

-- Create case_feedback table for investigator feedback on cases
CREATE TABLE public.case_feedback (
  feedback_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES public.fraud_cases(case_id) ON DELETE CASCADE,
  investigator_id BIGINT NOT NULL REFERENCES public.investigators(investigator_id),
  category public.feedback_category NOT NULL,
  approval_status public.approval_status NOT NULL DEFAULT 'PENDING',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transaction_feedback table for investigator feedback on transactions
CREATE TABLE public.transaction_feedback (
  feedback_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id BIGINT NOT NULL REFERENCES public.transactions(txn_id) ON DELETE CASCADE,
  investigator_id BIGINT NOT NULL REFERENCES public.investigators(investigator_id),
  category public.feedback_category NOT NULL,
  approval_status public.approval_status NOT NULL DEFAULT 'PENDING',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_case_feedback_case_id ON public.case_feedback(case_id);
CREATE INDEX idx_case_feedback_investigator ON public.case_feedback(investigator_id);
CREATE INDEX idx_transaction_feedback_txn_id ON public.transaction_feedback(txn_id);
CREATE INDEX idx_transaction_feedback_investigator ON public.transaction_feedback(investigator_id);

-- Enable RLS
ALTER TABLE public.case_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for case_feedback
CREATE POLICY "cf_admin_all" ON public.case_feedback FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "cf_investigator_own_read" ON public.case_feedback FOR SELECT
  USING (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = case_feedback.investigator_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "cf_investigator_insert" ON public.case_feedback FOR INSERT
  WITH CHECK (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = case_feedback.investigator_id AND i.user_id = auth.uid()
  ) AND user_is_assigned_investigator(case_id));

CREATE POLICY "cf_investigator_update_own" ON public.case_feedback FOR UPDATE
  USING (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = case_feedback.investigator_id AND i.user_id = auth.uid()
  ))
  WITH CHECK (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = case_feedback.investigator_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "cf_auditor_read" ON public.case_feedback FOR SELECT
  USING (is_auditor());

-- RLS policies for transaction_feedback
CREATE POLICY "tf_admin_all" ON public.transaction_feedback FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "tf_investigator_own_read" ON public.transaction_feedback FOR SELECT
  USING (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = transaction_feedback.investigator_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "tf_investigator_insert" ON public.transaction_feedback FOR INSERT
  WITH CHECK (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = transaction_feedback.investigator_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "tf_investigator_update_own" ON public.transaction_feedback FOR UPDATE
  USING (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = transaction_feedback.investigator_id AND i.user_id = auth.uid()
  ))
  WITH CHECK (is_investigator() AND EXISTS (
    SELECT 1 FROM public.investigators i
    WHERE i.investigator_id = transaction_feedback.investigator_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "tf_auditor_read" ON public.transaction_feedback FOR SELECT
  USING (is_auditor());

-- Create triggers for updated_at
CREATE TRIGGER update_case_feedback_updated_at
  BEFORE UPDATE ON public.case_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_feedback_updated_at
  BEFORE UPDATE ON public.transaction_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();