# 🚨 URGENT: Fix 500 Errors - Apply RLS Fix Migration

## 🔴 Current Problem
- **500 errors** when querying `fraud_cases` table
- **Error creating case**
- **Root cause**: `current_role_id` function doesn't exist, causing RLS policies to fail

---

## ✅ Solution: Apply RLS Fix Migration NOW

### Step 1: Run Diagnostic Query First
Copy and run this in Supabase SQL Editor to see what's missing:

```sql
-- Check if functions exist
SELECT 
  proname as function_name,
  CASE 
    WHEN proname IS NULL THEN '❌ DOES NOT EXIST'
    WHEN prosecdef = true THEN '✅ EXISTS (SECURITY DEFINER)'
    ELSE '⚠️ EXISTS BUT NOT SECURITY DEFINER'
  END as status
FROM pg_proc 
WHERE proname IN ('current_role_id', 'get_user_role_id');
```

**Expected if migration NOT applied**: No rows returned (functions don't exist)

---

### Step 2: Apply RLS Fix Migration

1. **Open**: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
2. **Copy ALL** (Ctrl+A, Ctrl+C)
3. **Paste in Supabase SQL Editor** (Ctrl+V)
4. **Click "Run"** (or Ctrl+Enter)
5. **Wait 10-30 seconds** for completion

---

### Step 3: Verify Migration Applied

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
- ✅ Should return **1 row**
- ✅ `owner` = `postgres`
- ✅ `is_security_definer` = `t` (true)

---

### Step 4: Test Your Application

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Go to**: http://localhost:8080/cases/new
3. **Try creating a case** - Should work now! ✅
4. **Check Dashboard** - Should load cases without 500 errors

---

## 🆘 If Still Getting 500 Errors

### Check 1: Did Migration Run Successfully?
- Look for "Success" message in SQL Editor
- Check for any error messages

### Check 2: Wait and Refresh
- Supabase may cache policies
- Wait 1-2 minutes
- Hard refresh browser (Ctrl+F5)

### Check 3: Verify Functions Exist
Run the diagnostic query above to confirm functions were created.

### Check 4: Check Browser Console
- Open browser DevTools (F12)
- Check Network tab for specific error messages
- Look for detailed error responses from Supabase

---

## 📋 What the Migration Does

1. ✅ **Creates `current_role_id()`** - Missing function that policies need
2. ✅ **Creates `get_user_role_id()`** - Safe alternative function
3. ✅ **Makes functions SECURITY DEFINER** - Bypasses RLS to prevent recursion
4. ✅ **Updates all policies** - Uses safe functions instead of recursive ones
5. ✅ **Fixes 500 errors** - Policies can now execute successfully

---

## ✅ Success Indicators

After applying migration, you should see:
- ✅ No more 500 errors in browser console
- ✅ Cases page loads successfully
- ✅ Can create new cases without errors
- ✅ Dashboard shows cases correctly

Apply the migration now to fix the 500 errors!

