# 🚀 Apply RLS Infinite Recursion Fix

## Quick Fix (2 Minutes)

Your migration file is ready! You just need to apply it to your Supabase database.

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration File**
   - Open: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
   - Select ALL (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for: **"Success. No rows returned"**

5. **Done!** ✅
   - Try creating a case at `/cases/new` - it should work now!

### Method 2: Supabase CLI (If Installed)

```bash
# Make sure you're in the project root
cd d:\guardian-shield

# Push migrations to Supabase
npx supabase db push
```

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
-- Check if functions are SECURITY DEFINER
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN (
  'current_role_id', 
  'get_user_role_id', 
  'user_owns_customer', 
  'user_is_assigned_investigator'
);
```

**Expected Results:**
- All functions should be owned by `postgres`
- `is_security_definer` should be `t` (true) for all

## Test Case Creation

After applying the migration:
1. Go to http://localhost:8080/cases/new
2. Fill out the form
3. Submit
4. Should work without recursion error! ✅

## What This Fix Does

The migration fixes the infinite recursion by:
1. Making `current_role_id()` SECURITY DEFINER (bypasses RLS)
2. Creating safe helper functions that bypass RLS
3. Updating all policies to use safe functions
4. Fixing triggers and other related issues

## Need Help?

If you still get errors after applying:
1. Check the SQL Editor output for error messages
2. Verify the migration ran successfully
3. Wait 1-2 minutes (Supabase may cache policies)
4. Try refreshing your app and creating a case again

