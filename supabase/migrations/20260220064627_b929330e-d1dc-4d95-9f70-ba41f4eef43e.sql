
-- Add created_by to blacklisted_recipients
ALTER TABLE public.blacklisted_recipients ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(user_id);

-- Allow investigators to insert into blacklisted_recipients
CREATE POLICY "blacklist_investigator_insert" ON public.blacklisted_recipients
FOR INSERT WITH CHECK (is_investigator());

-- Allow investigators to delete from blacklisted_recipients  
CREATE POLICY "blacklist_investigator_delete" ON public.blacklisted_recipients
FOR DELETE USING (is_investigator());

-- Allow admin to delete
CREATE POLICY "blacklist_admin_delete" ON public.blacklisted_recipients
FOR DELETE USING (is_admin());

-- Function to re-score all transactions linked to a blacklisted recipient
CREATE OR REPLACE FUNCTION public.rescore_blacklisted_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recipient text;
  v_txn RECORD;
BEGIN
  -- Get the recipient value from the trigger row
  IF TG_OP = 'INSERT' THEN
    v_recipient := NEW.recipient_value;
  ELSIF TG_OP = 'DELETE' THEN
    v_recipient := OLD.recipient_value;
  ELSE
    RETURN NULL;
  END IF;

  -- Re-run auto_score_transaction logic on affected transactions
  -- We do this by updating each affected transaction to trigger the BEFORE UPDATE scoring
  -- But auto_score_transaction is a BEFORE INSERT trigger, so we need a different approach
  -- Instead, directly recalculate for affected transactions
  FOR v_txn IN
    SELECT txn_id FROM public.transactions WHERE recipient_account = v_recipient
  LOOP
    -- Re-trigger scoring by doing a no-op update that fires the trigger
    UPDATE public.transactions SET recipient_account = recipient_account WHERE txn_id = v_txn.txn_id;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for blacklist changes
DROP TRIGGER IF EXISTS trg_rescore_on_blacklist_change ON public.blacklisted_recipients;
CREATE TRIGGER trg_rescore_on_blacklist_change
AFTER INSERT OR DELETE ON public.blacklisted_recipients
FOR EACH ROW
EXECUTE FUNCTION public.rescore_blacklisted_recipient();

-- Make auto_score_transaction also fire on UPDATE so re-scoring works
DROP TRIGGER IF EXISTS auto_score_transaction ON public.transactions;
CREATE TRIGGER auto_score_transaction
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_score_transaction();

-- After re-scoring transactions, update linked case severity
CREATE OR REPLACE FUNCTION public.sync_case_severity_from_txn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case_id bigint;
  v_new_severity severity_level;
BEGIN
  -- Find linked case
  SELECT ct.case_id INTO v_case_id
  FROM public.case_transactions ct
  WHERE ct.txn_id = NEW.txn_id
  LIMIT 1;

  IF v_case_id IS NOT NULL AND NEW.risk_level IN ('high', 'suspicious') THEN
    v_new_severity := CASE
      WHEN NEW.risk_level = 'high' THEN 'HIGH'::severity_level
      WHEN NEW.risk_level = 'suspicious' THEN 'MEDIUM'::severity_level
      ELSE 'LOW'::severity_level
    END;

    UPDATE public.fraud_cases
    SET severity = v_new_severity
    WHERE case_id = v_case_id
      AND severity::text < v_new_severity::text; -- Only upgrade, never downgrade
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_case_severity ON public.transactions;
CREATE TRIGGER trg_sync_case_severity
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_case_severity_from_txn();
