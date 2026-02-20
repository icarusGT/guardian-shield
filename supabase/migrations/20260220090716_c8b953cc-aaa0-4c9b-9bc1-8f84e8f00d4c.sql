
-- Validation trigger: block feedback and decision inserts when case is OPEN
CREATE OR REPLACE FUNCTION public.trg_require_under_investigation_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status case_status;
BEGIN
  SELECT status INTO v_status
  FROM public.fraud_cases
  WHERE case_id = NEW.case_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF v_status = 'OPEN' THEN
    RAISE EXCEPTION 'Cannot submit % while case is OPEN. Move the case to UNDER_INVESTIGATION first.', TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply to case_feedback
CREATE TRIGGER trg_case_feedback_require_investigation
  BEFORE INSERT ON public.case_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_require_under_investigation_fn();

-- Apply to case_decisions
CREATE TRIGGER trg_case_decisions_require_investigation
  BEFORE INSERT ON public.case_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_require_under_investigation_fn();
