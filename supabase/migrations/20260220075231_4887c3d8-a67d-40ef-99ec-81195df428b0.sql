
-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS trg_sync_case_severity ON public.transactions;

-- Change column to text
ALTER TABLE public.transactions 
  ALTER COLUMN risk_level TYPE text USING risk_level::text;

-- Set default back
ALTER TABLE public.transactions 
  ALTER COLUMN risk_level SET DEFAULT 'low'::text;

-- Recreate the sync trigger function (already exists, just re-reference)
-- Recreate the trigger
CREATE TRIGGER trg_sync_case_severity
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_case_severity_from_txn();
