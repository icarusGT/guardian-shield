-- Fix RLS policies for fraud_cases to resolve infinite recursion issue
-- This migration fixes the "infinite recursion detected in policy" error
-- when creating fraud cases
--
-- ROOT CAUSE: RLS policies on fraud_cases call helper functions (is_admin, is_customer, etc.)
-- which query the users table. The users table RLS policies also call these same functions,
-- creating infinite recursion.
--
-- SOLUTION: Create SECURITY DEFINER functions that bypass RLS completely by running as postgres user.
-- These functions query tables directly without triggering RLS checks.

-- ============================================================================
-- Function 1: Get user's role_id (bypasses RLS completely)
-- ============================================================================
-- This function MUST bypass RLS to prevent recursion
-- SECURITY DEFINER ensures it runs with postgres privileges, bypassing all RLS
create or replace function public.get_user_role_id()
returns int
language sql
stable
security definer
set search_path = public
as $$
  -- Direct query - RLS is bypassed because function runs as postgres (SECURITY DEFINER)
  -- This function executes with the privileges of the function owner (postgres)
  -- which completely bypasses all Row Level Security policies
  select coalesce(
    (select role_id from public.users where user_id = auth.uid() limit 1),
    4  -- Default to customer role if not found
  );
$$;

-- Ensure function owner is postgres (critical for RLS bypass)
alter function public.get_user_role_id() owner to postgres;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_role_id() to authenticated;

-- Revoke all from public and grant only to authenticated
revoke all on function public.get_user_role_id() from public;
grant execute on function public.get_user_role_id() to authenticated;

-- ============================================================================
-- Function 2: Check if current user owns a customer record (bypasses RLS)
-- ============================================================================
-- This function checks customer ownership without triggering RLS on customers table
create or replace function public.user_owns_customer(p_customer_id int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Direct query - RLS is bypassed because function runs as postgres (SECURITY DEFINER)
  select exists (
    select 1
    from public.customers
    where customer_id = p_customer_id
      and user_id = auth.uid()
    limit 1
  );
$$;

-- Ensure function owner is postgres
alter function public.user_owns_customer(int) owner to postgres;

-- Grant execute permission to authenticated users
grant execute on function public.user_owns_customer(int) to authenticated;

-- Revoke all from public and grant only to authenticated
revoke all on function public.user_owns_customer(int) from public;
grant execute on function public.user_owns_customer(int) to authenticated;

-- ============================================================================
-- Drop existing policies that cause recursion
-- ============================================================================
drop policy if exists cases_admin_all on public.fraud_cases;
drop policy if exists cases_customer_own_insert on public.fraud_cases;
drop policy if exists cases_investigator_insert on public.fraud_cases;
drop policy if exists cases_auditor_insert on public.fraud_cases;

-- ============================================================================
-- Recreate policies using RLS-safe functions
-- ============================================================================

-- Admin policy: Admins have full access (all operations)
create policy cases_admin_all
on public.fraud_cases
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

-- Customer insert policy: Customers can insert their own cases
-- Uses get_user_role_id() to check role (bypasses RLS)
-- Uses user_owns_customer() to verify ownership (bypasses RLS)
create policy cases_customer_own_insert
on public.fraud_cases
for insert
to authenticated
with check (
  public.get_user_role_id() = 4
  and public.user_owns_customer(fraud_cases.customer_id)
);

-- Investigator insert policy: Investigators can insert cases for any customer
create policy cases_investigator_insert
on public.fraud_cases
for insert
to authenticated
with check (public.get_user_role_id() = 2);

-- Auditor insert policy: Auditors can insert cases for any customer
create policy cases_auditor_insert
on public.fraud_cases
for insert
to authenticated
with check (public.get_user_role_id() = 3);

