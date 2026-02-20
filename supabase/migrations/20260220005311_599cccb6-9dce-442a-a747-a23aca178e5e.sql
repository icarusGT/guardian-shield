
-- Add communicated_at column to case_decisions
ALTER TABLE public.case_decisions
ADD COLUMN communicated_at timestamp with time zone DEFAULT NULL;
