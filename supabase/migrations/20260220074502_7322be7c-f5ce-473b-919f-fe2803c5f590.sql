
-- Widen txn_amount to support larger values (up to 9,999,999,999,999.99)
ALTER TABLE public.transactions 
  ALTER COLUMN txn_amount TYPE numeric(15,2);
