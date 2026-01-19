-- ============================================================================
-- COMPREHENSIVE DIAGNOSIS AND FIX SCRIPT
-- ============================================================================
-- Run this FIRST to diagnose the issue, then apply the fix
-- ============================================================================

-- ============================================================================
-- PART 1: DIAGNOSIS - Check Current State
-- ============================================================================

-- Check 1: Is current_role_id() SECURITY DEFINER? (Should be 't' if fixed)
SELECT 
  'DIAGNOSIS 1: current_role_id() Function' as check_name,
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ FIXED - Function bypasses RLS'
    WHEN prosecdef = false THEN '❌ NOT FIXED - Function still causes recursion'
    ELSE '❌ FUNCTION MISSING'
  END as status
FROM pg_proc 
WHERE proname = 'current_role_id';

-- Check 2: Does get_user_role_id() exist? (Should exist if migration applied)
SELECT 
  'DIAGNOSIS 2: get_user_role_id() Function' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_id') 
    THEN '✅ EXISTS - Migration appears applied'
    ELSE '❌ MISSING - Migration NOT applied'
  END as status;

-- Check 3: What policies exist on fraud_cases? (Should use get_user_role_id, not is_admin)
SELECT 
  'DIAGNOSIS 3: fraud_cases Policies' as check_name,
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
WHERE tablename = 'fraud_cases'
ORDER BY cmd, policyname;

-- Check 4: Check users table policies (these might still cause recursion)
SELECT 
  'DIAGNOSIS 4: users Table Policies' as check_name,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%is_admin%' OR with_check::text LIKE '%is_admin%'
    THEN '⚠️ Uses is_admin() - Will work if current_role_id() is fixed'
    ELSE '✅ Safe'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ============================================================================
-- PART 2: VERIFICATION - After Applying Fix
-- ============================================================================
-- Run these AFTER applying the migration to verify it worked

-- Verification 1: All functions should be SECURITY DEFINER
SELECT 
  'VERIFICATION 1: All Safe Functions' as check_name,
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN (
  'current_role_id', 
  'get_user_role_id', 
  'user_owns_customer', 
  'user_is_assigned_investigator',
  'user_is_investigator_with_id'
)
ORDER BY proname;

-- Verification 2: All fraud_cases policies should exist
SELECT 
  'VERIFICATION 2: fraud_cases Policies' as check_name,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'fraud_cases'
ORDER BY cmd, policyname;

-- Verification 3: Test if current_role_id() works without recursion
-- This should return a number (role_id) or NULL, NOT an error
SELECT 
  'VERIFICATION 3: Test current_role_id()' as check_name,
  public.current_role_id() as result,
  CASE 
    WHEN public.current_role_id() IS NOT NULL THEN '✅ Works - Returns role_id'
    ELSE '⚠️ Returns NULL (user might not be in users table)'
  END as status;

-- ============================================================================
-- PART 3: MANUAL FIX (If Migration Hasn't Been Applied)
-- ============================================================================
-- If diagnosis shows migration NOT applied, copy the entire contents of:
-- supabase/migrations/20260119195850_fraud_off_supabase.sql
-- and paste it below, then run it.

