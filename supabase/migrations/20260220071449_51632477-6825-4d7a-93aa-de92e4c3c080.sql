
-- Fix sync_case_severity_from_txn to handle all risk levels and allow downgrade
CREATE OR REPLACE FUNCTION public.sync_case_severity_from_txn()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_case_id bigint;
  v_new_severity severity_level;
BEGIN
  -- Find linked case
  SELECT ct.case_id INTO v_case_id
  FROM public.case_transactions ct
  WHERE ct.txn_id = NEW.txn_id
  LIMIT 1;

  IF v_case_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map risk_level to severity_level
  v_new_severity := CASE
    WHEN NEW.risk_level = 'high' THEN 'HIGH'::severity_level
    WHEN NEW.risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
    ELSE 'LOW'::severity_level
  END;

  -- Always sync (overwrite), severity is derived from transaction
  UPDATE public.fraud_cases
  SET severity = v_new_severity
  WHERE case_id = v_case_id;

  RETURN NEW;
END;
$function$;

-- Create a function to recalculate a single transaction's risk (re-trigger auto_score)
CREATE OR REPLACE FUNCTION public.recalculate_transaction_risk(p_txn_id bigint)
  RETURNS TABLE(new_risk_score integer, new_risk_level text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admin or investigator
  IF NOT (public.is_admin() OR public.is_investigator()) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Trigger the auto_score_transaction by doing a no-op update
  UPDATE public.transactions
  SET recipient_account = recipient_account
  WHERE txn_id = p_txn_id;

  -- Return updated values
  RETURN QUERY
  SELECT t.risk_score, t.risk_level
  FROM public.transactions t
  WHERE t.txn_id = p_txn_id;
END;
$function$;

-- Ensure the trigger exists on transactions for INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_sync_case_severity ON public.transactions;
CREATE TRIGGER trg_sync_case_severity
  AFTER INSERT OR UPDATE OF risk_score, risk_level ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_case_severity_from_txn();

-- Backfill: sync all existing cases to match their linked transaction's risk_level
UPDATE public.fraud_cases fc
SET severity = CASE
  WHEN t.risk_level = 'high' THEN 'HIGH'::severity_level
  WHEN t.risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
  ELSE 'LOW'::severity_level
END
FROM public.case_transactions ct
JOIN public.transactions t ON t.txn_id = ct.txn_id
WHERE ct.case_id = fc.case_id;
