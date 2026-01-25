-- Create decision_category enum for admin final decisions
CREATE TYPE public.decision_category AS ENUM (
  'FRAUD_CONFIRMED',
  'CLEARED',
  'PARTIAL_FRAUD',
  'INVESTIGATION_ONGOING',
  'INSUFFICIENT_EVIDENCE',
  'REFERRED_TO_AUTHORITIES'
);

-- Create decision_status enum
CREATE TYPE public.decision_status AS ENUM (
  'DRAFT',
  'FINAL',
  'COMMUNICATED'
);

-- Create case_decisions table for admin final decisions on cases
CREATE TABLE public.case_decisions (
  decision_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES public.fraud_cases(case_id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  category public.decision_category NOT NULL,
  status public.decision_status NOT NULL DEFAULT 'DRAFT',
  customer_message TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transaction_decisions table for admin final decisions on transactions
CREATE TABLE public.transaction_decisions (
  decision_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id BIGINT NOT NULL REFERENCES public.transactions(txn_id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  category public.decision_category NOT NULL,
  status public.decision_status NOT NULL DEFAULT 'DRAFT',
  customer_message TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_decisions
-- Admins can do everything
CREATE POLICY "cd_admin_all" ON public.case_decisions
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Auditors can read
CREATE POLICY "cd_auditor_read" ON public.case_decisions
FOR SELECT USING (is_auditor());

-- Customers can read FINAL/COMMUNICATED decisions for their own cases
CREATE POLICY "cd_customer_read_own" ON public.case_decisions
FOR SELECT USING (
  is_customer() 
  AND status IN ('FINAL', 'COMMUNICATED')
  AND EXISTS (
    SELECT 1 FROM fraud_cases fc
    JOIN customers c ON c.customer_id = fc.customer_id
    WHERE fc.case_id = case_decisions.case_id
    AND c.user_id = auth.uid()
  )
);

-- RLS Policies for transaction_decisions
-- Admins can do everything
CREATE POLICY "td_admin_all" ON public.transaction_decisions
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Auditors can read
CREATE POLICY "td_auditor_read" ON public.transaction_decisions
FOR SELECT USING (is_auditor());

-- Customers can read FINAL/COMMUNICATED decisions for their own transactions
CREATE POLICY "td_customer_read_own" ON public.transaction_decisions
FOR SELECT USING (
  is_customer() 
  AND status IN ('FINAL', 'COMMUNICATED')
  AND EXISTS (
    SELECT 1 FROM transactions t
    JOIN customers c ON c.customer_id = t.customer_id
    WHERE t.txn_id = transaction_decisions.txn_id
    AND c.user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_case_decisions_updated_at
  BEFORE UPDATE ON public.case_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_decisions_updated_at
  BEFORE UPDATE ON public.transaction_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_case_decisions_case_id ON public.case_decisions(case_id);
CREATE INDEX idx_case_decisions_admin ON public.case_decisions(admin_user_id);
CREATE INDEX idx_transaction_decisions_txn_id ON public.transaction_decisions(txn_id);
CREATE INDEX idx_transaction_decisions_admin ON public.transaction_decisions(admin_user_id);