-- Fix RLS policies that incorrectly block access with USING (false)

-- Drop the blocking policies on customers table
DROP POLICY IF EXISTS "customers_require_auth" ON public.customers;

-- Drop the blocking policies on transactions table  
DROP POLICY IF EXISTS "tx_require_auth" ON public.transactions;

-- Drop the blocking policies on fraud_cases table
DROP POLICY IF EXISTS "cases_require_auth" ON public.fraud_cases;

-- Drop the blocking policies on suspicious_transactions table
DROP POLICY IF EXISTS "susp_require_auth" ON public.suspicious_transactions;

-- Drop the blocking policies on users table
DROP POLICY IF EXISTS "users_require_auth" ON public.users;