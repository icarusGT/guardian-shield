-- Last updated: 20th January 2025
-- ============================================================================
-- COMPREHENSIVE FIX FOR case_assignments INFINITE RECURSION ERROR
-- ============================================================================
-- This script fixes the "infinite recursion detected in policy for relation 'case_assignments'"
-- error by replacing all recursive functions with SECURITY DEFINER versions.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix current_role_id() - THE ROOT CAUSE
-- ============================================================================
-- This function queries the users table, which has RLS policies that call
-- is_admin(), which calls current_role_id() again → INFINITE LOOP
-- Solution: Make it SECURITY DEFINER to bypass RLS completely

create or replace function public.current_role_id()
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_id int;
begin
  -- SECURITY DEFINER runs as postgres user, completely bypassing RLS
  -- Direct query without any RLS checks
  select role_id into v_role_id
  from public.users
  where user_id = auth.uid()
  limit 1;
  
  -- Return role_id or NULL if user not found
  return v_role_id;
end;
$$;

-- CRITICAL: Ensure function owner is postgres (required for RLS bypass)
alter function public.current_role_id() owner to postgres;

-- Grant execute permission to authenticated users only
grant execute on function public.current_role_id() to authenticated;
revoke all on function public.current_role_id() from public;

-- ============================================================================
-- STEP 2: Create get_user_role_id() - Safe wrapper function
-- ============================================================================
-- This is an alias for current_role_id() but with a clearer name
-- Used in policies to make it obvious we're using the safe version

create or replace function public.get_user_role_id()
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.current_role_id();
end;
$$;

alter function public.get_user_role_id() owner to postgres;
grant execute on function public.get_user_role_id() to authenticated;
revoke all on function public.get_user_role_id() from public;

-- ============================================================================
-- STEP 3: Create user_is_investigator_with_id() - Safe function for case_assignments
-- ============================================================================
-- This function checks if the current user is an investigator with a specific ID
-- Must use SECURITY DEFINER to bypass RLS on investigators table

create or replace function public.user_is_investigator_with_id(p_investigator_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  -- SECURITY DEFINER bypasses RLS on investigators table
  select exists (
    select 1
    from public.investigators i
    where i.investigator_id = p_investigator_id
      and i.user_id = auth.uid()
  ) into v_exists;
  
  return coalesce(v_exists, false);
end;
$$;

alter function public.user_is_investigator_with_id(bigint) owner to postgres;
grant execute on function public.user_is_investigator_with_id(bigint) to authenticated;
revoke all on function public.user_is_investigator_with_id(bigint) from public;

-- ============================================================================
-- STEP 4: Create user_owns_customer() - Safe function for customer checks
-- ============================================================================
-- Used in case_assignments policies to check if user owns a customer

create or replace function public.user_owns_customer(p_customer_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  -- SECURITY DEFINER bypasses RLS on customers table
  select exists (
    select 1
    from public.customers c
    where c.customer_id = p_customer_id
      and c.user_id = auth.uid()
  ) into v_exists;
  
  return coalesce(v_exists, false);
end;
$$;

alter function public.user_owns_customer(bigint) owner to postgres;
grant execute on function public.user_owns_customer(bigint) to authenticated;
revoke all on function public.user_owns_customer(bigint) from public;

-- ============================================================================
-- STEP 5: Drop ALL existing case_assignments policies
-- ============================================================================
-- These policies use is_admin(), is_investigator(), etc. which cause recursion
-- We drop ALL policies to ensure no recursive ones remain

drop policy if exists ca_admin_all on public.case_assignments;
drop policy if exists ca_investigator_own_read on public.case_assignments;
drop policy if exists ca_customer_read_own_case on public.case_assignments;
drop policy if exists ca_auditor_read on public.case_assignments;
drop policy if exists ca_investigator_insert on public.case_assignments;
drop policy if exists ca_admin_insert on public.case_assignments;

-- Drop any other policies that might exist (safety measure)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'case_assignments'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.case_assignments', r.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 6: Recreate case_assignments policies with SAFE functions
-- ============================================================================

-- Admin: Full access to all case assignments
create policy ca_admin_all
on public.case_assignments
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

-- Investigator: Can read their own assignments
create policy ca_investigator_own_read
on public.case_assignments
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_investigator_with_id(case_assignments.investigator_id)
);

-- Admin: Can insert assignments (for assigning cases to investigators)
create policy ca_admin_insert
on public.case_assignments
for insert
to authenticated
with check (public.get_user_role_id() = 1);

-- Auditor: Can read all case assignments
create policy ca_auditor_read
on public.case_assignments
for select
to authenticated
using (public.get_user_role_id() = 3);

-- Customer: Can read case assignments for their own cases
create policy ca_customer_read_own_case
on public.case_assignments
for select
to authenticated
using (
  public.get_user_role_id() = 4
  and exists (
    select 1
    from public.fraud_cases fc
    where fc.case_id = case_assignments.case_id
      and public.user_owns_customer(fc.customer_id)
  )
);

-- ============================================================================
-- STEP 7: Verify the fix worked
-- ============================================================================

-- Check that current_role_id() is SECURITY DEFINER
SELECT 
  'VERIFICATION: current_role_id() Function' as check_name,
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ FIXED - Function bypasses RLS'
    ELSE '❌ NOT FIXED'
  END as status
FROM pg_proc 
WHERE proname = 'current_role_id';

-- Check that all case_assignments policies exist and use safe functions
SELECT 
  'VERIFICATION: case_assignments Policies' as check_name,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%get_user_role_id%' OR with_check::text LIKE '%get_user_role_id%' 
    THEN '✅ Using safe function'
    WHEN qual::text LIKE '%is_admin%' OR with_check::text LIKE '%is_admin%'
    THEN '❌ Still using recursive function'
    ELSE '⚠️ Unknown'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'case_assignments'
ORDER BY cmd, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Fix applied successfully! The infinite recursion error should be resolved.' as result;

