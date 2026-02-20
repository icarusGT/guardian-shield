
ALTER TABLE public.case_feedback
  ADD COLUMN IF NOT EXISTS selected_categories text;
