<!-- Last updated: 20th January 2025 -->
# 🔧 Fix: Missing `current_role_id` Function

## ✅ Current Status
- ✅ Tables exist (fraud_cases table exists)
- ✅ Policies exist (RLS policies are trying to use functions)
- ❌ **Functions don't exist** (`current_role_id` is missing)
- ❌ Result: Infinite recursion error

---

## 🚀 Solution: Apply RLS Fix Migration

The RLS fix migration will **CREATE** the missing functions using `CREATE OR REPLACE`, so it will work even if functions don't exist yet.

### Step 1: Copy RLS Fix Migration
**File**: `supabase/migrations/20260119195850_fraud_off_supabase.sql`

1. Open the file (it's already open in your editor)
2. Press **Ctrl+A** (select all)
3. Press **Ctrl+C** (copy)

### Step 2: Paste in Supabase SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Click **"New query"** (or clear current query)
3. Paste (Ctrl+V)

### Step 3: Run the Migration
1. Click **"Run"** button (or Ctrl+Enter)
2. ⏳ Wait 10-30 seconds
3. ✅ Look for: **"Success. No rows returned"**

### Step 4: Verify Function Was Created
Run this query again:

```sql
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected Results:**
- Should return **1 row**
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

---

## ✅ Test Case Creation

After applying the migration:
1. Go to: http://localhost:8080/cases/new
2. Fill out the form
3. Click **"Create Case"**
4. Should work without recursion error! ✅

---

## 📋 What This Migration Does

1. ✅ **Creates `current_role_id()`** - Uses `CREATE OR REPLACE`, so it works even if function doesn't exist
2. ✅ **Makes it SECURITY DEFINER** - Bypasses RLS completely
3. ✅ **Creates safe helper functions** - `get_user_role_id()`, `user_owns_customer()`, etc.
4. ✅ **Updates all policies** - Uses safe functions instead of recursive ones

This will fix both the missing function issue AND the infinite recursion!

