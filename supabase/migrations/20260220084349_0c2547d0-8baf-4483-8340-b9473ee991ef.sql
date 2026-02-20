
-- Trigger function: when a case_transactions row is inserted, sync severity from the transaction
CREATE OR REPLACE FUNCTION public.sync_severity_on_case_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_risk_level text;
  v_new_severity severity_level;
BEGIN
  -- Get the transaction's current risk_level
  SELECT t.risk_level INTO v_risk_level
  FROM public.transactions t
  WHERE t.txn_id = NEW.txn_id;

  IF v_risk_level IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map risk_level to severity_level
  v_new_severity := CASE
    WHEN v_risk_level = 'high' THEN 'HIGH'::severity_level
    WHEN v_risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
    ELSE 'LOW'::severity_level
  END;

  -- Update the linked case's severity
  UPDATE public.fraud_cases
  SET severity = v_new_severity
  WHERE case_id = NEW.case_id;

  RETURN NEW;
END;
$$;

-- Create trigger on case_transactions for INSERT
CREATE TRIGGER trg_sync_severity_on_case_link
AFTER INSERT ON public.case_transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_severity_on_case_link();

-- Also ensure sync_case_severity_from_txn fires on BOTH INSERT and UPDATE of transactions
-- (currently it only fires on UPDATE)
DROP TRIGGER IF EXISTS trg_sync_case_severity ON public.transactions;
CREATE TRIGGER trg_sync_case_severity
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_case_severity_from_txn();

-- Fix all existing mismatched data
UPDATE public.fraud_cases fc
SET severity = CASE
    WHEN t.risk_level = 'high' THEN 'HIGH'::severity_level
    WHEN t.risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
    ELSE 'LOW'::severity_level
  END
FROM public.case_transactions ct
JOIN public.transactions t ON t.txn_id = ct.txn_id
WHERE ct.case_id = fc.case_id
  AND fc.severity != CASE
    WHEN t.risk_level = 'high' THEN 'HIGH'::severity_level
    WHEN t.risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
    ELSE 'LOW'::severity_level
  END;
