
-- Add new category values to feedback_category enum
ALTER TYPE public.feedback_category ADD VALUE IF NOT EXISTS 'EVIDENCE_REVIEW';
ALTER TYPE public.feedback_category ADD VALUE IF NOT EXISTS 'CUSTOMER_CLARIFICATION';
ALTER TYPE public.feedback_category ADD VALUE IF NOT EXISTS 'RECOMMENDATION';

-- Add subcategory text column to case_feedback
ALTER TABLE public.case_feedback ADD COLUMN IF NOT EXISTS subcategory text;

-- Add investigation_note required text column (separate from optional comment)
ALTER TABLE public.case_feedback ADD COLUMN IF NOT EXISTS investigation_note text;
