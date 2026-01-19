-- ============================================================================
-- VERIFICATION SCRIPT: Check if RLS Fix Has Been Applied
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the migration was applied correctly
-- ============================================================================

-- 1. Check if functions exist and are SECURITY DEFINER
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER'
    ELSE '❌ NOT SECURITY DEFINER'
  END as status
FROM pg_proc 
WHERE proname IN (
  'current_role_id', 
  'get_user_role_id', 
  'user_owns_customer', 
  'user_is_assigned_investigator',
  'user_is_investigator_with_id'
)
ORDER BY proname;

-- Expected: All should show '✅ SECURITY DEFINER' and owner = 'postgres'

-- 2. Check if fraud_cases policies exist and use safe functions
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'fraud_cases'
ORDER BY cmd, policyname;

-- Expected: Should see policies like:
-- - cases_admin_all
-- - cases_customer_own_insert
-- - cases_investigator_insert
-- - cases_auditor_insert
-- - cases_auditor_read
-- - cases_customer_own_read
-- - cases_investigator_assigned_read

-- 3. Check if policies use safe functions (not recursive ones)
SELECT 
  policyname,
  tablename,
  cmd,
  CASE 
    WHEN qual LIKE '%get_user_role_id%' OR qual LIKE '%user_owns_customer%' OR qual LIKE '%user_is_assigned_investigator%' THEN '✅ Uses safe function'
    WHEN qual LIKE '%is_admin()%' OR qual LIKE '%is_customer()%' THEN '⚠️ Uses old recursive function'
    ELSE '❓ Unknown'
  END as function_check
FROM pg_policies 
WHERE tablename = 'fraud_cases'
ORDER BY policyname;

-- Expected: All should show '✅ Uses safe function'

-- 4. Test if current_role_id() works without recursion
-- This should return your role_id without errors
SELECT 
  public.current_role_id() as your_role_id,
  CASE 
    WHEN public.current_role_id() = 1 THEN 'Admin'
    WHEN public.current_role_id() = 2 THEN 'Investigator'
    WHEN public.current_role_id() = 3 THEN 'Auditor'
    WHEN public.current_role_id() = 4 THEN 'Customer'
    ELSE 'Unknown'
  END as role_name;

-- Expected: Should return a number (1-4) without recursion error

-- 5. Summary
SELECT 
  'Functions Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All functions exist'
    ELSE '❌ Missing functions'
  END as status
FROM pg_proc 
WHERE proname IN (
  'current_role_id', 
  'get_user_role_id', 
  'user_owns_customer', 
  'user_is_assigned_investigator',
  'user_is_investigator_with_id'
)
UNION ALL
SELECT 
  'Policies Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ All policies exist'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies 
WHERE tablename = 'fraud_cases';

