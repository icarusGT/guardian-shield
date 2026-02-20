
-- 1. Add risk_reasons JSONB column to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS risk_reasons jsonb NOT NULL DEFAULT '{"high_amount":0,"rapid_reports":0,"blacklisted_recipient":0,"location_mismatch":0}'::jsonb;

-- 2. Replace auto_score_transaction to populate risk_reasons as single source of truth
CREATE OR REPLACE FUNCTION public.auto_score_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_high_amount int := 0;
  v_rapid_reports int := 0;
  v_blacklisted int := 0;
  v_location_mismatch int := 0;
  v_score int := 0;
  v_level text := 'low';
  v_customer_id bigint;
  v_freq_count int;
  v_is_blacklisted boolean;
  v_common_location text;
  v_location_count int;
BEGIN
  v_customer_id := NEW.customer_id;

  -- Rule 1: High Amount (>= 10000 BDT)
  IF NEW.txn_amount >= 10000 THEN
    v_high_amount := 30;
  END IF;

  -- Rule 2: Rapid Reports (3+ in 5 min window)
  SELECT count(*) INTO v_freq_count
  FROM public.transactions
  WHERE customer_id = v_customer_id
    AND txn_id != NEW.txn_id
    AND occurred_at >= (now() - interval '5 minutes');
  IF v_freq_count >= 2 THEN
    v_rapid_reports := 25;
  END IF;

  -- Rule 3: Blacklisted Recipient
  IF NEW.recipient_account IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.blacklisted_recipients
      WHERE recipient_value = NEW.recipient_account
    ) INTO v_is_blacklisted;
    IF v_is_blacklisted THEN
      v_blacklisted := 50;
    END IF;
  END IF;

  -- Rule 4: Location Mismatch
  IF NEW.txn_location IS NOT NULL THEN
    SELECT txn_location, count(*)
    INTO v_common_location, v_location_count
    FROM public.transactions
    WHERE customer_id = v_customer_id
      AND txn_id != NEW.txn_id
      AND txn_location IS NOT NULL
      AND occurred_at >= (now() - interval '30 days')
    GROUP BY txn_location
    ORDER BY count(*) DESC
    LIMIT 1;

    IF v_location_count >= 3 AND v_common_location IS NOT NULL AND NEW.txn_location != v_common_location THEN
      v_location_mismatch := 20;
    END IF;
  END IF;

  -- Compute total from individual rule points
  v_score := v_high_amount + v_rapid_reports + v_blacklisted + v_location_mismatch;

  -- Determine risk level
  IF v_score >= 60 THEN
    v_level := 'high';
  ELSIF v_score >= 30 THEN
    v_level := 'suspicious';
  ELSE
    v_level := 'low';
  END IF;

  -- Write BOTH risk_score and risk_reasons atomically
  NEW.risk_score := v_score;
  NEW.risk_level := v_level;
  NEW.is_flagged := (v_level IN ('suspicious', 'high'));
  NEW.risk_reasons := jsonb_build_object(
    'high_amount', v_high_amount,
    'rapid_reports', v_rapid_reports,
    'blacklisted_recipient', v_blacklisted,
    'location_mismatch', v_location_mismatch
  );

  RETURN NEW;
END;
$function$;

-- 3. Backfill all existing transactions by triggering a no-op update
-- This fires the BEFORE UPDATE trigger which recalculates everything
UPDATE public.transactions SET recipient_account = recipient_account;

-- 4. Notify PostgREST to pick up schema changes
NOTIFY pgrst, 'reload schema';
