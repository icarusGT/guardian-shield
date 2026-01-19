-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check case_assignments RLS Policy Status
-- ============================================================================
-- Run this BEFORE and AFTER applying the fix to verify the issue is resolved
-- ============================================================================

-- Check 1: Verify current_role_id() is SECURITY DEFINER (should be TRUE)
SELECT 
  'CHECK 1: current_role_id() Function' as check_name,
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

-- Check 2: List all case_assignments policies and check if they use safe functions
SELECT 
  'CHECK 2: case_assignments Policies' as check_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%get_user_role_id%' OR with_check::text LIKE '%get_user_role_id%' 
    THEN '✅ Using safe function (get_user_role_id)'
    WHEN qual::text LIKE '%user_is_investigator_with_id%' OR with_check::text LIKE '%user_is_investigator_with_id%'
    THEN '✅ Using safe function (user_is_investigator_with_id)'
    WHEN qual::text LIKE '%user_owns_customer%' OR with_check::text LIKE '%user_owns_customer%'
    THEN '✅ Using safe function (user_owns_customer)'
    WHEN qual::text LIKE '%is_admin%' OR with_check::text LIKE '%is_admin%'
    THEN '❌ Still using recursive function (is_admin)'
    WHEN qual::text LIKE '%is_investigator%' OR with_check::text LIKE '%is_investigator%'
    THEN '❌ Still using recursive function (is_investigator)'
    WHEN qual::text LIKE '%is_customer%' OR with_check::text LIKE '%is_customer%'
    THEN '❌ Still using recursive function (is_customer)'
    ELSE '⚠️ Unknown function usage'
  END as policy_status,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'case_assignments'
ORDER BY cmd, policyname;

-- Check 3: Verify all required safe functions exist
SELECT 
  'CHECK 3: Required Safe Functions' as check_name,
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ Exists and is SECURITY DEFINER'
    WHEN prosecdef = false THEN '⚠️ Exists but NOT SECURITY DEFINER'
    ELSE '❌ MISSING'
  END as status
FROM pg_proc 
WHERE proname IN (
  'current_role_id', 
  'get_user_role_id', 
  'user_is_investigator_with_id',
  'user_owns_customer'
)
ORDER BY proname;

-- Check 4: Test if we can query case_assignments without recursion
-- This will show an error if recursion still exists
DO $$
DECLARE
    v_test_count int;
BEGIN
    BEGIN
        -- Try to count case_assignments (this will trigger RLS policies)
        SELECT COUNT(*) INTO v_test_count
        FROM public.case_assignments
        LIMIT 1;
        
        RAISE NOTICE 'CHECK 4: ✅ Query test PASSED - No recursion detected';
    EXCEPTION 
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%infinite recursion%' THEN
                RAISE NOTICE 'CHECK 4: ❌ Query test FAILED - Infinite recursion still exists: %', SQLERRM;
            ELSE
                RAISE NOTICE 'CHECK 4: ⚠️ Query test ERROR (may be permission issue): %', SQLERRM;
            END IF;
    END;
END $$;

-- Summary
SELECT 
  'SUMMARY' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'current_role_id' AND prosecdef = true
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'case_assignments' 
      AND (qual::text LIKE '%is_admin%' OR qual::text LIKE '%is_investigator%' OR qual::text LIKE '%is_customer%'
           OR with_check::text LIKE '%is_admin%' OR with_check::text LIKE '%is_investigator%' OR with_check::text LIKE '%is_customer%')
    ) THEN '✅ FIXED - All policies use safe functions'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'case_assignments' 
      AND (qual::text LIKE '%is_admin%' OR qual::text LIKE '%is_investigator%' OR qual::text LIKE '%is_customer%'
           OR with_check::text LIKE '%is_admin%' OR with_check::text LIKE '%is_investigator%' OR with_check::text LIKE '%is_customer%')
    ) THEN '❌ NOT FIXED - Policies still use recursive functions'
    ELSE '⚠️ UNKNOWN - Please check individual checks above'
  END as overall_status;

