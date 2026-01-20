<!-- Last updated: 20th January 2025 -->
# RLS Infinite Recursion Fix - Complete Deep Solution

## Problem
Getting error: `Failed to create case: infinite recursion detected in policy for relation "fraud_cases"`

This error occurs **100% of the time** when trying to create a case because of circular dependencies in RLS policies.

## Root Cause Analysis (Deep Investigation)

### The Infinite Recursion Chain:

1. **User tries to INSERT into `fraud_cases`**
2. **PostgreSQL checks RLS policies** on `fraud_cases` table
3. **Policy calls `is_admin()` or `is_customer()`** helper functions
4. **Helper functions call `current_role_id()`**
5. **`current_role_id()` queries `public.users` table**
6. **`public.users` table has RLS enabled** with policies that call `is_admin()`, `is_customer()`, etc.
7. **These policies call `current_role_id()` again** → **INFINITE LOOP!**

```
fraud_cases INSERT → RLS Policy → is_admin() → current_role_id() 
→ users table RLS → is_admin() → current_role_id() → users table RLS → ...
```

### Additional Issues Found:

1. **Triggers inserting into RLS-protected tables:**
   - `trg_suspicious_auto_case_fn()` inserts into `fraud_cases` (triggers RLS)
   - `trg_case_status_history_fn()` inserts into `case_history` (no INSERT policy)
   - Audit triggers insert into `audit_log` (no INSERT policy, SELECT policy uses recursive functions)

2. **Other tables with recursive policies:**
   - `case_assignments` policies query `investigators` table (has RLS)
   - `case_transactions` policies use recursive functions
   - `case_history` policies use recursive functions

## Complete Solution

The migration file `supabase/migrations/20260119195850_fraud_off_supabase.sql` implements a **comprehensive fix** that addresses ALL issues:

### Step 1: Fix Root Cause
- **Replaces `current_role_id()`** with SECURITY DEFINER version that bypasses RLS completely
- This automatically fixes ALL helper functions (`is_admin`, `is_customer`, `is_investigator`, `is_auditor`)

### Step 2: Create Safe Helper Functions
- `get_user_role_id()` - Safe version of current_role_id()
- `user_owns_customer(bigint)` - Safely checks customer ownership
- `user_is_assigned_investigator(bigint)` - Safely checks case assignments
- `user_is_investigator_with_id(bigint)` - Safely checks investigator ID

### Step 3: Fix All Policies
- **fraud_cases**: All policies updated to use safe functions
- **case_assignments**: Policies updated to use safe functions
- **case_transactions**: Policies updated to use safe functions
- **case_history**: Policies updated + INSERT policy added for triggers
- **audit_log**: Policies updated + INSERT policy added for triggers

### Step 4: Fix Triggers
- `trg_suspicious_auto_case_fn()` made SECURITY DEFINER so it can insert cases

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the **ENTIRE** contents of `supabase/migrations/20260119195850_fraud_off_supabase.sql`
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify success - you should see "Success. No rows returned"

### Option 2: Supabase CLI (if installed)
```bash
npx supabase db push
```

## Verification Steps

After applying the migration, verify it worked:

### 1. Check Function Ownership
```sql
SELECT 
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
);
```

**Expected Results:**
- All functions should be owned by `postgres`
- `is_security_definer` should be `t` (true) for all

### 2. Check Policies Exist
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'fraud_cases'
ORDER BY cmd, policyname;
```

**Expected Results:**
- Should see: `cases_admin_all`, `cases_customer_own_insert`, `cases_investigator_insert`, `cases_auditor_insert`, `cases_auditor_read`, `cases_customer_own_read`, `cases_investigator_assigned_read`

### 3. Test Case Creation
Try creating a case through your application UI at `/cases/new`. It should work without any recursion errors.

### 4. Test Direct SQL Insert (Optional)
```sql
-- As an authenticated user, try inserting a case
INSERT INTO public.fraud_cases (
  customer_id, 
  title, 
  description, 
  category, 
  severity, 
  status
)
VALUES (
  1,  -- Replace with valid customer_id
  'Test Case', 
  'Test Description', 
  'OTHER', 
  'LOW', 
  'OPEN'
);
```

Should work without recursion error.

## What the Migration Does (Complete List)

1. ✅ **Fixes `current_role_id()`** - Root cause fix, bypasses RLS
2. ✅ **Creates `get_user_role_id()`** - Safe helper function
3. ✅ **Creates `user_owns_customer()`** - Safe customer ownership check
4. ✅ **Creates `user_is_assigned_investigator()`** - Safe case assignment check
5. ✅ **Creates `user_is_investigator_with_id()`** - Safe investigator ID check
6. ✅ **Fixes all `fraud_cases` policies** - Uses safe functions
7. ✅ **Fixes all `case_assignments` policies** - Uses safe functions
8. ✅ **Fixes all `case_transactions` policies** - Uses safe functions
9. ✅ **Fixes all `case_history` policies** - Uses safe functions + adds INSERT policy
10. ✅ **Fixes all `audit_log` policies** - Uses safe functions + adds INSERT policy
11. ✅ **Fixes `trg_suspicious_auto_case_fn()`** - Makes it SECURITY DEFINER

## Important Notes

- **SECURITY DEFINER functions** run with the privileges of the function owner (`postgres`)
- This **completely bypasses Row Level Security** when querying tables
- Functions are owned by `postgres` to ensure proper privilege escalation
- Only authenticated users can execute these functions
- All helper functions (`is_admin`, `is_customer`, etc.) now automatically work correctly because they use the fixed `current_role_id()`

## If Still Not Working

If you still get recursion errors after applying the migration:

1. **Verify migration was applied:**
   - Check Supabase Dashboard → Database → Migrations
   - The migration `20260119195850_fraud_off_supabase` should be listed

2. **Check for errors during migration:**
   - Look at the SQL Editor output for any error messages
   - Common issues:
     - Policy doesn't exist: That's OK, `DROP POLICY IF EXISTS` handles it
     - Function already exists: That's OK, `CREATE OR REPLACE` updates it
     - Permission errors: Make sure you're logged in as project admin

3. **Manually verify functions:**
   ```sql
   -- This should work without recursion
   SELECT public.get_user_role_id();
   SELECT public.current_role_id();
   ```

4. **Check if other migrations conflict:**
   - Make sure no other migrations modify the same functions or policies
   - Check migration order - this should run after the initial schema migration

5. **Clear Supabase cache (if applicable):**
   - Sometimes Supabase caches policies
   - Try restarting your Supabase project or wait a few minutes

6. **Contact Support:**
   - If nothing works, contact Supabase support with:
     - Migration file contents
     - Error messages
     - Verification query results

## Technical Details

### Why SECURITY DEFINER Works

When a function is marked `SECURITY DEFINER`:
- It runs with the privileges of the function **owner** (postgres), not the caller
- PostgreSQL **bypasses RLS** for queries inside the function
- This breaks the recursion chain because the function can read `users` table without triggering RLS

### Why We Need Multiple Functions

Different policies need different checks:
- `get_user_role_id()` - Simple role check
- `user_owns_customer()` - Checks customer ownership (queries `customers` table)
- `user_is_assigned_investigator()` - Checks case assignments (queries `case_assignments` and `investigators`)
- `user_is_investigator_with_id()` - Checks investigator ID (queries `investigators`)

All use SECURITY DEFINER to bypass RLS on the tables they query.

## Success Criteria

After applying this migration, you should be able to:
- ✅ Create fraud cases without recursion errors
- ✅ View cases based on your role
- ✅ Have triggers work correctly (auto-case creation, audit logging, case history)
- ✅ All RLS policies work as intended without recursion

This is a **complete, production-ready solution** that addresses the root cause and all related issues.
