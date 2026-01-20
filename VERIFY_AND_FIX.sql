-- Last updated: 20th January 2025
-- ============================================================================
-- STEP 1: VERIFY IF MIGRATION WAS APPLIED
-- ============================================================================
-- Run this FIRST to check if the fix is already applied

-- Check if current_role_id() is SECURITY DEFINER (should return 't' if fixed)
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ FIXED - Function bypasses RLS'
    ELSE '❌ NOT FIXED - Function still causes recursion'
  END as status
FROM pg_proc 
WHERE proname = 'current_role_id';

-- Check if get_user_role_id() exists (should exist if migration applied)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_id'
    ) THEN '✅ Migration appears to be applied'
    ELSE '❌ Migration NOT applied - get_user_role_id() function missing'
  END as migration_status;

-- Check fraud_cases policies (should use get_user_role_id, not is_admin)
SELECT 
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

-- ============================================================================
-- IF ABOVE SHOWS "NOT FIXED", THEN COPY THE ENTIRE CONTENTS OF:
-- supabase/migrations/20260119195850_fraud_off_supabase.sql
-- AND PASTE IT BELOW, THEN RUN IT
-- ============================================================================

