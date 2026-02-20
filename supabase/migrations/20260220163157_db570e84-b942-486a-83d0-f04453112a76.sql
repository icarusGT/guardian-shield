
-- Add admin_approved and approved_at to case_decisions
ALTER TABLE public.case_decisions
  ADD COLUMN IF NOT EXISTS admin_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone DEFAULT NULL;
