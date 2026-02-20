
-- Add primary_region and address to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS primary_region varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address text DEFAULT NULL;

-- Allow customers to update their own profile
CREATE POLICY "customers_update_own"
  ON public.customers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop and recreate view preserving original column order
DROP VIEW IF EXISTS public.customers_safe;
CREATE VIEW public.customers_safe AS
  SELECT
    customer_id,
    user_id,
    home_location,
    created_at,
    '***'::varchar AS nid_number,
    primary_region,
    address
  FROM public.customers;

-- Update auto_score_transaction to use primary_region for location mismatch
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
  v_primary_region text;
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

  -- Rule 4: Region Mismatch (compare txn_location with customer's primary_region)
  IF NEW.txn_location IS NOT NULL THEN
    SELECT c.primary_region INTO v_primary_region
    FROM public.customers c
    WHERE c.customer_id = v_customer_id;

    IF v_primary_region IS NOT NULL AND lower(trim(NEW.txn_location)) != lower(trim(v_primary_region)) THEN
      v_location_mismatch := 20;
    END IF;
  END IF;

  -- Compute total
  v_score := v_high_amount + v_rapid_reports + v_blacklisted + v_location_mismatch;

  -- Determine risk level
  IF v_score >= 60 THEN
    v_level := 'high';
  ELSIF v_score >= 30 THEN
    v_level := 'suspicious';
  ELSE
    v_level := 'low';
  END IF;

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
