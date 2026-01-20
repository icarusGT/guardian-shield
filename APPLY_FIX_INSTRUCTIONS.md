<!-- Last updated: 20th January 2025 -->
# 🔧 How to Fix "Infinite Recursion" Error for case_assignments

## 🚨 Problem
You're getting this error:
```
Failed to load assignments: infinite recursion detected in policy for relation "case_assignments"
```

## ✅ Solution (3 Steps)

### Step 1: Diagnose the Issue (30 seconds)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `CHECK_CASE_ASSIGNMENTS_STATUS.sql`
3. Click **Run** (or press Ctrl+Enter)
4. Check the results:
   - If you see "❌ NOT FIXED" → Continue to Step 2
   - If you see "✅ FIXED" → The issue should be resolved, but if you still get errors, continue to Step 2

### Step 2: Apply the Fix (2 minutes)

1. In **Supabase Dashboard** → **SQL Editor**
2. Open the file `FIX_CASE_ASSIGNMENTS_RECURSION.sql`
3. **Select ALL** (Ctrl+A)
4. **Copy** (Ctrl+C)
5. **Paste** into SQL Editor (Ctrl+V)
6. Click **Run** (or press Ctrl+Enter)
7. Wait for: **"Success. No rows returned"** or **"✅ Fix applied successfully!"**

### Step 3: Verify the Fix (30 seconds)

1. Run `CHECK_CASE_ASSIGNMENTS_STATUS.sql` again
2. All checks should show **✅ FIXED**
3. Test your application:
   - Go to the Investigations page
   - Try loading assignments
   - The error should be gone! ✅

## 🔬 What This Fix Does

### Root Cause:
The `case_assignments` table has RLS policies that use functions like `is_admin()`, `is_investigator()`, etc. These functions call `current_role_id()`, which queries the `users` table. The `users` table also has RLS policies that call `is_admin()` again, creating an infinite loop:

```
case_assignments SELECT → RLS Policy → is_admin() → current_role_id() 
→ users table RLS → is_admin() → current_role_id() → users table RLS → ...
```

### The Fix:
1. **Makes `current_role_id()` SECURITY DEFINER** - This bypasses RLS completely when querying the `users` table
2. **Creates safe helper functions** - `get_user_role_id()`, `user_is_investigator_with_id()`, `user_owns_customer()` - all use SECURITY DEFINER
3. **Replaces all `case_assignments` policies** - Removes policies using recursive functions (`is_admin`, `is_investigator`, `is_customer`) and replaces them with safe functions

## 📋 Files Included

- `FIX_CASE_ASSIGNMENTS_RECURSION.sql` - The complete fix script
- `CHECK_CASE_ASSIGNMENTS_STATUS.sql` - Diagnostic script to check status

## ⚠️ Important Notes

- **This fix is safe** - It only changes RLS policies and functions, not your data
- **No data loss** - Your existing case assignments remain intact
- **Backward compatible** - All existing functionality continues to work
- **If you still get errors** - Make sure you ran the entire script (all steps), not just parts of it

## 🆘 Still Having Issues?

If you still get recursion errors after applying the fix:

1. **Check if the script ran completely** - Look for any error messages in the SQL Editor
2. **Verify function ownership** - Run this query:
   ```sql
   SELECT proname, pg_get_userbyid(proowner), prosecdef 
   FROM pg_proc 
   WHERE proname IN ('current_role_id', 'get_user_role_id');
   ```
   Both should show `prosecdef = true` and `owner = postgres`

3. **Check policies** - Run this query:
   ```sql
   SELECT policyname, qual::text, with_check::text 
   FROM pg_policies 
   WHERE tablename = 'case_assignments';
   ```
   None should contain `is_admin`, `is_investigator`, or `is_customer`

4. **Contact support** - If none of the above helps, there may be additional policies or triggers causing issues

