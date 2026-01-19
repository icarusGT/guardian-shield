-- ============================================================================
-- DIAGNOSTIC QUERIES - Check Database State
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the issue
-- ============================================================================

-- 1. Check if current_role_id function exists
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN proname IS NULL THEN '❌ FUNCTION DOES NOT EXIST'
    WHEN prosecdef = true THEN '✅ EXISTS AND IS SECURITY DEFINER'
    ELSE '⚠️ EXISTS BUT NOT SECURITY DEFINER'
  END as status
FROM pg_proc 
WHERE proname = 'current_role_id';

-- 2. Check if fraud_cases table exists
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NULL THEN '❌ TABLE DOES NOT EXIST'
    ELSE '✅ TABLE EXISTS'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'fraud_cases';

-- 3. Check fraud_cases RLS policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual LIKE '%get_user_role_id%' OR qual LIKE '%user_owns_customer%' THEN '✅ Uses safe function'
    WHEN qual LIKE '%is_admin()%' OR qual LIKE '%is_customer()%' THEN '⚠️ Uses old recursive function'
    ELSE '❓ Unknown'
  END as function_check,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'fraud_cases'
ORDER BY policyname;

-- 4. Check if get_user_role_id function exists (from RLS fix migration)
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN proname IS NULL THEN '❌ FUNCTION DOES NOT EXIST - RLS FIX NOT APPLIED'
    WHEN prosecdef = true THEN '✅ EXISTS AND IS SECURITY DEFINER - RLS FIX APPLIED'
    ELSE '⚠️ EXISTS BUT NOT SECURITY DEFINER'
  END as status
FROM pg_proc 
WHERE proname = 'get_user_role_id';

-- 5. Summary - What needs to be done?
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_role_id') 
      THEN '❌ CRITICAL: current_role_id function missing - Apply RLS fix migration!'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_id')
      THEN '❌ CRITICAL: get_user_role_id function missing - Apply RLS fix migration!'
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_role_id' AND prosecdef = false)
      THEN '⚠️ WARNING: current_role_id exists but is not SECURITY DEFINER - Apply RLS fix migration!'
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_id' AND prosecdef = true)
      THEN '✅ GOOD: RLS fix migration appears to be applied'
    ELSE '❓ UNKNOWN STATE'
  END as diagnosis,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fraud_cases')
      THEN '❌ CRITICAL: fraud_cases table missing - Apply base schema migration first!'
    ELSE '✅ fraud_cases table exists'
  END as table_status;

