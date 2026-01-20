<!-- Last updated: 20th January 2025 -->
# 🔧 Apply RLS Fix Migration NOW

## ✅ Current Status
- ✅ Base schema migration: Applied (tables exist)
- ❌ RLS fix migration: NOT applied yet
- ❌ Result: Infinite recursion error when creating cases

---

## 🚀 Apply RLS Fix Migration

### Step 1: Open RLS Fix Migration File
**File**: `supabase/migrations/20260119195850_fraud_off_supabase.sql`

This file fixes the infinite recursion by:
- Making `current_role_id()` SECURITY DEFINER (bypasses RLS)
- Creating safe helper functions
- Updating all policies to use safe functions

### Step 2: Copy ALL Contents
1. Open the file in your editor
2. Press **Ctrl+A** (select all)
3. Press **Ctrl+C** (copy)

### Step 3: Paste in Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"** button
5. Paste (Ctrl+V)

### Step 4: Run the Migration
1. Click **"Run"** button (or press Ctrl+Enter)
2. ⏳ Wait for completion (10-30 seconds)
3. ✅ Look for: **"Success. No rows returned"**

### Step 5: Verify It Worked
Run this query:

```sql
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected Results:**
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

If you see this → **Fix is applied!** ✅

---

## ✅ Test Case Creation

After applying the fix:
1. Go back to: http://localhost:8080/cases/new
2. Fill out the form
3. Click **"Create Case"**
4. Should work without recursion error! ✅

---

## 🆘 Troubleshooting

### "Policy does not exist" warnings
→ **This is OK!** The migration uses `DROP POLICY IF EXISTS`, so warnings are safe to ignore.

### "Function already exists" warnings  
→ **This is OK!** The migration uses `CREATE OR REPLACE`, so it updates existing functions.

### Still getting recursion errors?
1. Wait 1-2 minutes (Supabase may cache policies)
2. Refresh your browser
3. Try creating a case again
4. Verify the function is SECURITY DEFINER (use verification query above)

---

## 📋 What This Migration Does

1. ✅ **Fixes `current_role_id()`** - Makes it SECURITY DEFINER (bypasses RLS)
2. ✅ **Creates safe helper functions** - All use SECURITY DEFINER
3. ✅ **Updates all `fraud_cases` policies** - Uses safe functions instead of recursive ones
4. ✅ **Fixes related tables** - transactions, case_assignments, etc.

This breaks the infinite recursion chain completely!

