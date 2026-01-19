-- ============================================================================
-- COMPREHENSIVE RLS INFINITE RECURSION FIX
-- ============================================================================
-- This migration fixes the "infinite recursion detected in policy" error
-- when creating fraud cases and other operations.
--
-- ROOT CAUSE ANALYSIS:
-- 1. current_role_id() queries public.users table
-- 2. public.users has RLS policies that call is_admin(), is_customer(), etc.
-- 3. These helper functions call current_role_id() again
-- 4. This creates infinite recursion: users RLS → is_admin() → current_role_id() → users RLS → ...
--
-- SOLUTION:
-- Replace current_role_id() with a SECURITY DEFINER version that bypasses RLS.
-- This automatically fixes ALL helper functions (is_admin, is_customer, etc.)
-- Also fix all other functions that query RLS-protected tables.
-- ============================================================================

-- ============================================================================
-- STEP 1: Replace current_role_id() with RLS-safe version
-- ============================================================================
-- This is THE CRITICAL FIX - replaces the recursive function with one that bypasses RLS
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
-- STEP 2: Create additional RLS-safe helper functions
-- ============================================================================

-- Function 1: Get user's role_id (alias for current_role_id, but more explicit)
-- This is redundant but kept for clarity in policies
create or replace function public.get_user_role_id()
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_id int;
begin
  -- SECURITY DEFINER bypasses RLS completely
  select role_id into v_role_id
  from public.users
  where user_id = auth.uid()
  limit 1;
  
  -- Return role_id or default to customer (4) if not found
  return coalesce(v_role_id, 4);
end;
$$;

alter function public.get_user_role_id() owner to postgres;
grant execute on function public.get_user_role_id() to authenticated;
revoke all on function public.get_user_role_id() from public;

-- Function 2: Check if current user owns a customer record (bypasses RLS)
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
  -- SECURITY DEFINER bypasses RLS - direct query without RLS checks
  select exists (
    select 1
    from public.customers
    where customer_id = p_customer_id
      and user_id = auth.uid()
  ) into v_exists;
  
  return coalesce(v_exists, false);
end;
$$;

alter function public.user_owns_customer(bigint) owner to postgres;
grant execute on function public.user_owns_customer(bigint) to authenticated;
revoke all on function public.user_owns_customer(bigint) from public;

-- Function 3: Check if current user is assigned to a case as investigator (bypasses RLS)
-- CRITICAL: This queries case_assignments and investigators tables which have RLS
-- Must use SECURITY DEFINER to bypass their RLS policies
create or replace function public.user_is_assigned_investigator(p_case_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  -- SECURITY DEFINER bypasses RLS on case_assignments and investigators tables
  select exists (
    select 1
    from public.case_assignments ca
    join public.investigators i on i.investigator_id = ca.investigator_id
    where ca.case_id = p_case_id
      and i.user_id = auth.uid()
  ) into v_exists;
  
  return coalesce(v_exists, false);
end;
$$;

alter function public.user_is_assigned_investigator(bigint) owner to postgres;
grant execute on function public.user_is_assigned_investigator(bigint) to authenticated;
revoke all on function public.user_is_assigned_investigator(bigint) from public;

-- Function 4: Check if user is investigator for a specific investigator_id (bypasses RLS)
-- Used in case_assignments policies
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
-- STEP 3: Drop existing policies that cause recursion
-- ============================================================================
-- Drop ALL fraud_cases policies that use recursive functions
drop policy if exists cases_admin_all on public.fraud_cases;
drop policy if exists cases_customer_own_insert on public.fraud_cases;
drop policy if exists cases_investigator_insert on public.fraud_cases;
drop policy if exists cases_auditor_insert on public.fraud_cases;
drop policy if exists cases_auditor_read on public.fraud_cases;
drop policy if exists cases_customer_own_read on public.fraud_cases;
drop policy if exists cases_investigator_assigned_read on public.fraud_cases;

-- ============================================================================
-- STEP 4: Recreate fraud_cases policies using RLS-safe functions
-- ============================================================================

-- Admin policy: Admins have full access (all operations)
create policy cases_admin_all
on public.fraud_cases
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

-- Customer insert policy: Customers can insert their own cases
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

-- Auditor read policy
create policy cases_auditor_read
on public.fraud_cases
for select
to authenticated
using (public.get_user_role_id() = 3);

-- Customer read policy: Customers can read their own cases
create policy cases_customer_own_read
on public.fraud_cases
for select
to authenticated
using (
  public.get_user_role_id() = 4
  and public.user_owns_customer(fraud_cases.customer_id)
);

-- Investigator read policy: Investigators can read assigned cases
create policy cases_investigator_assigned_read
on public.fraud_cases
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_assigned_investigator(fraud_cases.case_id)
);

-- ============================================================================
-- STEP 5: Fix case_assignments policies to prevent recursion
-- ============================================================================
-- Drop existing policies that use recursive functions
drop policy if exists ca_admin_all on public.case_assignments;
drop policy if exists ca_investigator_own_read on public.case_assignments;
drop policy if exists ca_customer_read_own_case on public.case_assignments;

-- Recreate with safe functions
create policy ca_admin_all
on public.case_assignments
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

create policy ca_investigator_own_read
on public.case_assignments
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_investigator_with_id(case_assignments.investigator_id)
);

-- Customer can read case assignments for their own cases
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
-- STEP 6: Verify helper functions are now safe
-- ============================================================================
-- The helper functions (is_admin, is_customer, etc.) now use the fixed
-- current_role_id() function, so they should work correctly.
-- However, for fraud_cases policies, we use get_user_role_id() directly
-- to be extra safe and avoid any potential issues.

-- ============================================================================
-- STEP 7: Fix audit_log INSERT policy to prevent recursion
-- ============================================================================
-- The audit_log table has RLS enabled but no INSERT policy, which blocks
-- audit triggers from inserting. Also, the SELECT policy uses is_admin()
-- which causes recursion. Fix both issues.

-- Drop existing audit_log policy
drop policy if exists audit_log_admin_read on public.audit_log;

-- Create new SELECT policy using safe function
create policy audit_log_admin_read
on public.audit_log
for select
to authenticated
using (public.get_user_role_id() = 1 or public.get_user_role_id() = 3);

-- Create INSERT policy that allows triggers to insert
-- Triggers run as SECURITY DEFINER, but we also allow authenticated users
-- to insert audit logs (though typically only triggers do this)
create policy audit_log_insert
on public.audit_log
for insert
to authenticated
with check (true);  -- Allow all authenticated users (triggers) to insert

-- ============================================================================
-- STEP 8: Ensure audit trigger functions can insert without RLS issues
-- ============================================================================
-- The audit functions (audit_cases_ins_fn, etc.) are not SECURITY DEFINER,
-- so they run as the current user. When they insert into audit_log,
-- RLS checks the INSERT policy. Since we now have a permissive INSERT policy,
-- this should work. However, to be extra safe, we could make them SECURITY DEFINER.
-- For now, the INSERT policy should be sufficient.

-- ============================================================================
-- STEP 9: Fix case_history policies and ensure triggers can insert
-- ============================================================================
-- The case_history table has RLS enabled but no INSERT policy, which blocks
-- the trigger from inserting. Also update SELECT policies to use safe functions.

-- Drop existing case_history policies
drop policy if exists case_history_admin_all on public.case_history;
drop policy if exists case_history_auditor_read on public.case_history;
drop policy if exists case_history_investigator_read on public.case_history;

-- Create INSERT policy for triggers
create policy case_history_insert
on public.case_history
for insert
to authenticated
with check (true);  -- Allow all authenticated users (triggers) to insert

-- Recreate SELECT policies using safe functions
create policy case_history_admin_all
on public.case_history
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

create policy case_history_auditor_read
on public.case_history
for select
to authenticated
using (public.get_user_role_id() = 3);

create policy case_history_investigator_read
on public.case_history
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_assigned_investigator(case_history.case_id)
);

-- ============================================================================
-- STEP 10: Fix trg_suspicious_auto_case_fn to handle RLS
-- ============================================================================
-- This trigger inserts into fraud_cases, which will check RLS policies.
-- The trigger function should be SECURITY DEFINER to bypass RLS, OR
-- we need to ensure the insert happens with proper permissions.
-- Actually, looking at the original code, it's not SECURITY DEFINER, so
-- it will use the current user's permissions. This might fail if the
-- current user doesn't have permission to insert into fraud_cases.
-- However, this trigger is typically called by the system when a suspicious
-- transaction is inserted, so we need to make it SECURITY DEFINER.

-- Make the trigger function SECURITY DEFINER so it can insert cases
create or replace function public.trg_suspicious_auto_case_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
  v_case_id bigint;
  v_severity severity_level := 'LOW';
  v_category case_category := 'PAYMENT_FRAUD';
begin
  select customer_id into v_customer_id
  from public.transactions
  where txn_id = new.txn_id
  limit 1;

  if v_customer_id is null then
    raise exception 'Auto-case failed: transaction not found for suspicious txn_id.';
  end if;

  v_severity := case new.risk_level
    when 'HIGH' then 'HIGH'
    when 'MEDIUM' then 'MEDIUM'
    else 'LOW'
  end;

  insert into public.fraud_cases(customer_id, title, description, category, severity, status, created_at)
  values (
    v_customer_id,
    'Auto Case: Suspicious TXN #'||new.txn_id,
    'Auto-generated from suspicious transaction. Risk score='||new.risk_score||', Level='||new.risk_level||
      coalesce(', Reasons='||new.reasons,''),
    v_category,
    v_severity,
    'OPEN',
    now()
  )
  returning case_id into v_case_id;

  insert into public.case_transactions(case_id, txn_id)
  values (v_case_id, new.txn_id)
  on conflict do nothing;

  return new;
end $$;

alter function public.trg_suspicious_auto_case_fn() owner to postgres;

-- ============================================================================
-- STEP 11: Fix investigators policies to use safe functions
-- ============================================================================
-- CRITICAL: Investigations page fetches investigators
-- Drop existing policies that use recursive functions
drop policy if exists investigators_self_or_admin on public.investigators;

-- Recreate with safe functions
-- Investigators can see themselves, admins and auditors can see all
create policy investigators_self_or_admin
on public.investigators
for select
to authenticated
using (
  user_id = auth.uid()
  or public.get_user_role_id() = 1
  or public.get_user_role_id() = 3
  or public.get_user_role_id() = 2  -- Investigators can see other investigators
);

-- ============================================================================
-- STEP 12: Add INSERT policy for case_assignments (for Investigations page)
-- ============================================================================
-- CRITICAL: Investigations page needs to insert assignments
-- Admins can assign investigators to cases
create policy ca_admin_insert
on public.case_assignments
for insert
to authenticated
with check (public.get_user_role_id() = 1);

-- ============================================================================
-- STEP 13: Add UPDATE policy for fraud_cases (for Investigations page)
-- ============================================================================
-- CRITICAL: Investigations page needs to update case status
-- Admins can update any case, investigators can update assigned cases
create policy cases_admin_update
on public.fraud_cases
for update
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

create policy cases_investigator_update_assigned
on public.fraud_cases
for update
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_assigned_investigator(fraud_cases.case_id)
)
with check (
  public.get_user_role_id() = 2
  and public.user_is_assigned_investigator(fraud_cases.case_id)
);

-- ============================================================================
-- STEP 14: Fix case_transactions policies to use safe functions
-- ============================================================================
-- Update policies to use safe functions to prevent recursion

-- Drop existing policies
drop policy if exists ct_admin_all on public.case_transactions;
drop policy if exists ct_investigator_assigned_read on public.case_transactions;

-- Recreate with safe functions
create policy ct_admin_all
on public.case_transactions
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

create policy ct_investigator_assigned_read
on public.case_transactions
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and public.user_is_assigned_investigator(case_transactions.case_id)
);

-- ============================================================================
-- STEP 15: Fix transactions policies to use safe functions
-- ============================================================================
-- CRITICAL: Transactions page needs these policies fixed to work
-- Drop existing policies that use recursive functions
drop policy if exists tx_admin_all on public.transactions;
drop policy if exists tx_auditor_read on public.transactions;
drop policy if exists tx_customer_own_read on public.transactions;
drop policy if exists tx_investigator_assigned_read on public.transactions;

-- Recreate with safe functions
-- Admin policy: Admins have full access
create policy tx_admin_all
on public.transactions
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

-- Auditor policy: Auditors can read all transactions
create policy tx_auditor_read
on public.transactions
for select
to authenticated
using (public.get_user_role_id() = 3);

-- Customer policy: Customers can read their own transactions
create policy tx_customer_own_read
on public.transactions
for select
to authenticated
using (
  public.get_user_role_id() = 4
  and public.user_owns_customer(transactions.customer_id)
);

-- Investigator policy: Investigators can read transactions for assigned cases
create policy tx_investigator_assigned_read
on public.transactions
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and exists (
    select 1
    from public.case_transactions ct
    where ct.txn_id = transactions.txn_id
      and public.user_is_assigned_investigator(ct.case_id)
  )
);

-- ============================================================================
-- STEP 16: Fix suspicious_transactions policies to use safe functions
-- ============================================================================
-- CRITICAL: Transactions page fetches suspicious_transactions
-- Drop existing policies that use recursive functions
drop policy if exists susp_admin_all on public.suspicious_transactions;
drop policy if exists susp_auditor_read on public.suspicious_transactions;
drop policy if exists susp_investigator_read on public.suspicious_transactions;

-- Recreate with safe functions
-- Admin policy: Admins have full access
create policy susp_admin_all
on public.suspicious_transactions
for all
to authenticated
using (public.get_user_role_id() = 1)
with check (public.get_user_role_id() = 1);

-- Auditor policy: Auditors can read all suspicious transactions
create policy susp_auditor_read
on public.suspicious_transactions
for select
to authenticated
using (public.get_user_role_id() = 3);

-- Investigator policy: Investigators can read suspicious transactions for assigned cases
create policy susp_investigator_read
on public.suspicious_transactions
for select
to authenticated
using (
  public.get_user_role_id() = 2
  and exists (
    select 1
    from public.case_transactions ct
    where ct.txn_id = suspicious_transactions.txn_id
      and public.user_is_assigned_investigator(ct.case_id)
  )
);

-- ============================================================================
-- SUMMARY OF FIXES
-- ============================================================================
-- 1. Fixed current_role_id() to bypass RLS (root cause fix)
-- 2. Created get_user_role_id() as safe alternative
-- 3. Created user_owns_customer() to safely check customer ownership
-- 4. Created user_is_assigned_investigator() to safely check case assignments
-- 5. Created user_is_investigator_with_id() for case_assignments policies
-- 6. Fixed all fraud_cases policies to use safe functions
-- 7. Fixed case_assignments policies to use safe functions
-- 8. Fixed audit_log policies and added INSERT policy for triggers
-- 9. Fixed case_history policies and added INSERT policy for triggers
-- 10. Made trg_suspicious_auto_case_fn() SECURITY DEFINER
-- 11. Fixed investigators policies to use safe functions (for Investigations page)
-- 12. Added INSERT policy for case_assignments (for Investigations page)
-- 13. Added UPDATE policies for fraud_cases (for Investigations page)
-- 14. Fixed case_transactions policies to use safe functions
-- 15. Fixed transactions policies to use safe functions (for Transactions page)
-- 16. Fixed suspicious_transactions policies to use safe functions (for Transactions page)
--
-- All helper functions (is_admin, is_customer, etc.) now automatically work
-- correctly because they use the fixed current_role_id() function.

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================
-- 1. Check function ownership:
--    SELECT proname, pg_get_userbyid(proowner) as owner, prosecdef
--    FROM pg_proc 
--    WHERE proname IN ('current_role_id', 'get_user_role_id', 'user_owns_customer', 'user_is_assigned_investigator');
--    All should be owned by 'postgres' and prosecdef should be 't'
--
-- 2. Check policies exist:
--    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'fraud_cases';
--    Should see all policies listed above
--
-- 3. Test insert (as authenticated user):
--    INSERT INTO public.fraud_cases (customer_id, title, description, category, severity, status)
--    VALUES (1, 'Test Case', 'Test', 'OTHER', 'LOW', 'OPEN');
--    Should work without recursion error
