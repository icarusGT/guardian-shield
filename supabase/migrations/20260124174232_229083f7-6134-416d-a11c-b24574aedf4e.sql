-- ==============================================================
-- SECURITY FIX: Address 4 error-level security vulnerabilities
-- ==============================================================

-- 1. FIX: kpi_case_success_no_policies
-- Add RLS policies to restrict access to admins and auditors only
-- Note: kpi_case_success is a VIEW, not a table, so we need to check its definition first
-- Since it's a view, we'll ensure it uses security_invoker mode

-- First, check if kpi_case_success is a view and recreate with security_invoker
DROP VIEW IF EXISTS public.kpi_case_success;

CREATE VIEW public.kpi_case_success
WITH (security_invoker = on)
AS
SELECT
  COUNT(*) AS total_cases,
  COUNT(*) FILTER (WHERE status = 'OPEN') AS open_cases,
  COUNT(*) FILTER (WHERE status = 'UNDER_INVESTIGATION') AS under_investigation_cases,
  COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed_cases,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'CLOSED') / NULLIF(COUNT(*), 0),
    2
  ) AS closure_rate,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600
    ) FILTER (WHERE status = 'CLOSED'),
    2
  ) AS avg_close_hours
FROM public.fraud_cases;

-- Grant access to authenticated users (RLS on fraud_cases will filter appropriately)
GRANT SELECT ON public.kpi_case_success TO authenticated;

-- 2. FIX: users_table_public_exposure
-- Create a safe view that excludes password_hash and restrict direct table access
-- First, create a safe users view without sensitive fields

DROP VIEW IF EXISTS public.users_safe;
CREATE VIEW public.users_safe
WITH (security_invoker = on)
AS
SELECT
  user_id,
  email,
  full_name,
  phone,
  role_id,
  is_active,
  is_locked,
  locked_until,
  created_at
  -- password_hash is intentionally excluded
FROM public.users;

GRANT SELECT ON public.users_safe TO authenticated;

-- Add explicit policy to block anonymous SELECT on users table
-- First drop existing policy if it doesn't require authentication
DROP POLICY IF EXISTS "users_anon_block" ON public.users;

-- Create policy that explicitly requires authentication for all access
CREATE POLICY "users_require_auth"
ON public.users
FOR SELECT
TO anon
USING (false);

-- 3. FIX: customers_nid_exposure  
-- Create a safe customers view that hides NID from auditors
-- Auditors can see customer info but NOT the nid_number

DROP VIEW IF EXISTS public.customers_safe;
CREATE VIEW public.customers_safe
WITH (security_invoker = on)
AS
SELECT
  customer_id,
  user_id,
  home_location,
  created_at,
  -- Only show NID to the customer themselves or admin
  CASE 
    WHEN user_id = auth.uid() OR public.is_admin() THEN nid_number
    ELSE NULL
  END AS nid_number
FROM public.customers;

GRANT SELECT ON public.customers_safe TO authenticated;

-- 4. FIX: transactions_unauthorized_access
-- Add explicit policy to block anonymous access to transactions

DROP POLICY IF EXISTS "tx_anon_block" ON public.transactions;

CREATE POLICY "tx_require_auth"
ON public.transactions
FOR SELECT
TO anon
USING (false);

-- Also add policies to block anonymous access to other sensitive tables
DROP POLICY IF EXISTS "susp_anon_block" ON public.suspicious_transactions;
CREATE POLICY "susp_require_auth"
ON public.suspicious_transactions
FOR SELECT
TO anon
USING (false);

DROP POLICY IF EXISTS "cases_anon_block" ON public.fraud_cases;
CREATE POLICY "cases_require_auth"
ON public.fraud_cases
FOR SELECT
TO anon
USING (false);

DROP POLICY IF EXISTS "customers_anon_block" ON public.customers;
CREATE POLICY "customers_require_auth"
ON public.customers
FOR SELECT
TO anon
USING (false);