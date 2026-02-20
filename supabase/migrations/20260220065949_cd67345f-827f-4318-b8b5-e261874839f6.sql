
-- Step 1: Update trigger function FIRST (before any data changes)
CREATE OR REPLACE FUNCTION public.auto_score_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score integer := 0;
  v_level text := 'low';
  v_customer_id bigint;
  v_freq_count integer;
  v_is_blacklisted boolean;
  v_common_location text;
  v_location_count integer;
BEGIN
  v_customer_id := NEW.customer_id;
  IF NEW.txn_amount >= 10000 THEN v_score := v_score + 30; END IF;
  SELECT count(*) INTO v_freq_count FROM public.transactions
  WHERE customer_id = v_customer_id AND txn_id != NEW.txn_id AND occurred_at >= (now() - interval '5 minutes');
  IF v_freq_count >= 2 THEN v_score := v_score + 25; END IF;
  IF NEW.recipient_account IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.blacklisted_recipients WHERE recipient_value = NEW.recipient_account) INTO v_is_blacklisted;
    IF v_is_blacklisted THEN v_score := v_score + 50; END IF;
  END IF;
  IF NEW.txn_location IS NOT NULL THEN
    SELECT txn_location, count(*) INTO v_common_location, v_location_count FROM public.transactions
    WHERE customer_id = v_customer_id AND txn_id != NEW.txn_id AND txn_location IS NOT NULL AND occurred_at >= (now() - interval '30 days')
    GROUP BY txn_location ORDER BY count(*) DESC LIMIT 1;
    IF v_location_count >= 3 AND v_common_location IS NOT NULL AND NEW.txn_location != v_common_location THEN v_score := v_score + 20; END IF;
  END IF;
  IF v_score >= 60 THEN v_level := 'high';
  ELSIF v_score >= 30 THEN v_level := 'suspicious';
  ELSE v_level := 'low';
  END IF;
  NEW.risk_score := v_score;
  NEW.risk_level := v_level;
  NEW.is_flagged := (v_level IN ('suspicious', 'high'));
  RETURN NEW;
END;
$function$;

-- Step 2: Drop old constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_risk_level_check;

-- Step 3: Directly set values bypassing trigger by disabling it temporarily
ALTER TABLE public.transactions DISABLE TRIGGER auto_score_transaction;

UPDATE public.transactions
SET risk_level = CASE
    WHEN risk_score >= 60 THEN 'high'
    WHEN risk_score >= 30 THEN 'suspicious'
    ELSE 'low'
  END,
  is_flagged = (risk_score >= 30);

ALTER TABLE public.transactions ENABLE TRIGGER auto_score_transaction;

-- Step 4: Add new constraint
ALTER TABLE public.transactions ADD CONSTRAINT transactions_risk_level_check 
  CHECK (risk_level = ANY (ARRAY['low'::text, 'suspicious'::text, 'high'::text]));

-- Step 5: Set default
ALTER TABLE public.transactions ALTER COLUMN risk_level SET DEFAULT 'low';

-- Step 6: Sync case severity
UPDATE public.fraud_cases fc
SET severity = sub.new_severity
FROM (
  SELECT ct.case_id,
    CASE WHEN MAX(CASE WHEN t.risk_level = 'high' THEN 3 WHEN t.risk_level = 'suspicious' THEN 2 ELSE 1 END) = 3 THEN 'HIGH'::severity_level
         WHEN MAX(CASE WHEN t.risk_level = 'high' THEN 3 WHEN t.risk_level = 'suspicious' THEN 2 ELSE 1 END) = 2 THEN 'MEDIUM'::severity_level
         ELSE 'LOW'::severity_level END as new_severity
  FROM public.case_transactions ct JOIN public.transactions t ON t.txn_id = ct.txn_id GROUP BY ct.case_id
) sub WHERE fc.case_id = sub.case_id;
