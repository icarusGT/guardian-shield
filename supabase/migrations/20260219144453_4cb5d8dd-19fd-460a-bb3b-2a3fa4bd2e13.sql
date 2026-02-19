
-- 1. Add risk scoring columns to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS risk_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_level text NOT NULL DEFAULT 'normal'
    CHECK (risk_level IN ('normal', 'suspicious', 'high')),
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

-- 2. Create blacklisted_recipients table
CREATE TABLE IF NOT EXISTS public.blacklisted_recipients (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_value text NOT NULL UNIQUE,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blacklisted_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blacklist
CREATE POLICY "blacklist_admin_all" ON public.blacklisted_recipients
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Auditors can read
CREATE POLICY "blacklist_auditor_read" ON public.blacklisted_recipients
FOR SELECT USING (public.is_auditor());

-- Investigators can read
CREATE POLICY "blacklist_investigator_read" ON public.blacklisted_recipients
FOR SELECT USING (public.is_investigator());

-- 3. Create the auto risk scoring trigger function
CREATE OR REPLACE FUNCTION public.auto_score_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score integer := 0;
  v_level text := 'normal';
  v_customer_id bigint;
  v_freq_count integer;
  v_is_blacklisted boolean;
  v_common_location text;
  v_location_count integer;
BEGIN
  v_customer_id := NEW.customer_id;

  -- Rule 1: High amount >= 10000 BDT => +30
  IF NEW.txn_amount >= 10000 THEN
    v_score := v_score + 30;
  END IF;

  -- Rule 2: Frequency - 3+ transactions in last 5 minutes => +25
  SELECT count(*) INTO v_freq_count
  FROM public.transactions
  WHERE customer_id = v_customer_id
    AND txn_id != NEW.txn_id
    AND occurred_at >= (now() - interval '5 minutes');

  IF v_freq_count >= 2 THEN  -- 2 previous + current = 3 total
    v_score := v_score + 25;
  END IF;

  -- Rule 3: Blacklisted recipient => +50
  IF NEW.recipient_account IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.blacklisted_recipients
      WHERE recipient_value = NEW.recipient_account
    ) INTO v_is_blacklisted;

    IF v_is_blacklisted THEN
      v_score := v_score + 50;
    END IF;
  END IF;

  -- Rule 4: Location mismatch from most common location in last 30 days => +20
  IF NEW.txn_location IS NOT NULL THEN
    SELECT txn_location, count(*) INTO v_common_location, v_location_count
    FROM public.transactions
    WHERE customer_id = v_customer_id
      AND txn_id != NEW.txn_id
      AND txn_location IS NOT NULL
      AND occurred_at >= (now() - interval '30 days')
    GROUP BY txn_location
    ORDER BY count(*) DESC
    LIMIT 1;

    IF v_location_count >= 3 AND v_common_location IS NOT NULL AND NEW.txn_location != v_common_location THEN
      v_score := v_score + 20;
    END IF;
  END IF;

  -- Map risk_level
  IF v_score >= 70 THEN
    v_level := 'high';
  ELSIF v_score >= 35 THEN
    v_level := 'suspicious';
  ELSE
    v_level := 'normal';
  END IF;

  NEW.risk_score := v_score;
  NEW.risk_level := v_level;
  NEW.is_flagged := (v_level IN ('suspicious', 'high'));

  RETURN NEW;
END;
$$;

-- 4. Attach trigger to transactions table (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trg_auto_score_transaction ON public.transactions;
CREATE TRIGGER trg_auto_score_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_score_transaction();
