-- ============================================================================
-- QUICK STATUS CHECK - Is Migration Applied?
-- ============================================================================
-- Run this to instantly see if the fix is applied
-- ============================================================================

-- Check if migration was applied
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_role_id' 
      AND prosecdef = true
      AND pg_get_userbyid(proowner) = 'postgres'
    ) THEN '✅ MIGRATION APPLIED - Fix is active!'
    ELSE '❌ MIGRATION NOT APPLIED - You need to run the migration!'
  END as migration_status;

-- Detailed check
SELECT 
  'Function Status' as check_type,
  proname as function_name,
  CASE 
    WHEN prosecdef = true AND pg_get_userbyid(proowner) = 'postgres' THEN '✅ Fixed'
    WHEN prosecdef = false THEN '❌ Not Fixed (still recursive)'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_proc 
WHERE proname IN ('current_role_id', 'get_user_role_id')
ORDER BY proname;

-- Policy check
SELECT 
  'Policy Status' as check_type,
  policyname,
  CASE 
    WHEN qual::text LIKE '%get_user_role_id%' OR with_check::text LIKE '%get_user_role_id%' 
    THEN '✅ Using safe function'
    WHEN qual::text LIKE '%is_admin%' OR with_check::text LIKE '%is_admin%'
    THEN '❌ Still using recursive function'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_policies 
WHERE tablename = 'fraud_cases' 
AND cmd = 'INSERT'
LIMIT 5;

