<!-- Last updated: 20th January 2025 -->
# 🚨 URGENT: Fix Infinite Recursion Error NOW

## ⚠️ You're Still Getting the Error Because Migration Wasn't Applied!

The migration file exists but **hasn't been executed on your database yet**. 

## 🔍 STEP 1: DIAGNOSE (30 seconds)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `DIAGNOSE_AND_FIX.sql`
3. Run it
4. Check the results:
   - If you see "❌ NOT FIXED" → Migration not applied
   - If you see "✅ FIXED" → Migration applied, but there's another issue

## ⚡ STEP 2: APPLY FIX (2 minutes)

### Method A: Supabase Dashboard (RECOMMENDED)

1. **Open:** https://supabase.com/dashboard
2. **Select** your project
3. **Click:** SQL Editor
4. **Open file:** `supabase/migrations/20260119195850_fraud_off_supabase.sql`
5. **Select ALL** (Ctrl+A)
6. **Copy** (Ctrl+C)
7. **Paste** in SQL Editor (Ctrl+V)
8. **Click Run** (or Ctrl+Enter)
9. **Wait for:** "Success. No rows returned"

### Method B: Verify It Worked

Run this in SQL Editor:

```sql
SELECT 
  proname,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected:**
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

## ✅ STEP 3: TEST

1. Go to your app: http://localhost:8080/cases/new
2. Try creating a case
3. **It should work now!** ✅

## 🔬 DEEP ANALYSIS: Why This Happens

### The Recursion Chain:

```
User tries to INSERT into fraud_cases
  ↓
PostgreSQL checks RLS policy on fraud_cases
  ↓
Policy calls: is_admin() or is_customer()
  ↓
is_admin() calls: current_role_id()
  ↓
current_role_id() queries: SELECT from public.users
  ↓
PostgreSQL checks RLS policy on users table
  ↓
users RLS policy calls: is_admin() or is_auditor()
  ↓
is_admin() calls: current_role_id() AGAIN
  ↓
current_role_id() queries: SELECT from public.users AGAIN
  ↓
INFINITE LOOP! 💥
```

### The Fix:

1. **Replace `current_role_id()`** with SECURITY DEFINER version
   - SECURITY DEFINER = Runs as `postgres` user
   - `postgres` user bypasses ALL RLS policies
   - Breaks the recursion chain

2. **Update all policies** to use safe functions
   - Instead of `is_admin()` → use `get_user_role_id() = 1`
   - Instead of `is_customer()` → use `get_user_role_id() = 4`
   - All safe functions use SECURITY DEFINER

## 🎯 What the Migration Does

The migration (`20260119195850_fraud_off_supabase.sql`) does:

1. ✅ **Fixes `current_role_id()`** - Makes it SECURITY DEFINER (bypasses RLS)
2. ✅ **Creates `get_user_role_id()`** - Safe alternative function
3. ✅ **Creates helper functions** - All use SECURITY DEFINER
4. ✅ **Drops old policies** - Removes recursive policies
5. ✅ **Creates new policies** - Uses safe functions
6. ✅ **Fixes all tables** - fraud_cases, transactions, investigators, etc.

## 🆘 If Still Not Working After Applying

### Check 1: Did Migration Actually Run?
```sql
SELECT proname FROM pg_proc WHERE proname = 'get_user_role_id';
```
- Should return 1 row
- If empty → Migration didn't run

### Check 2: Are Policies Updated?
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'fraud_cases';
```
- Should see: `cases_admin_all`, `cases_customer_own_insert`, etc.
- If you see old names → Policies weren't dropped/recreated

### Check 3: Is Function SECURITY DEFINER?
```sql
SELECT prosecdef FROM pg_proc WHERE proname = 'current_role_id';
```
- Should be `t` (true)
- If `f` (false) → Function wasn't updated

### Check 4: Wait and Retry
- Sometimes Supabase caches policies
- Wait 1-2 minutes
- Refresh your app
- Try again

## 📋 Complete Checklist

- [ ] Opened Supabase Dashboard
- [ ] Went to SQL Editor
- [ ] Copied entire migration file
- [ ] Pasted and ran migration
- [ ] Saw "Success" message
- [ ] Verified `current_role_id()` is SECURITY DEFINER
- [ ] Tested creating a case
- [ ] It works! ✅

## 🎉 Success Criteria

After applying migration:
- ✅ Can create cases without recursion error
- ✅ Transactions page works
- ✅ Investigations page works
- ✅ All RLS policies work correctly
- ✅ No more infinite recursion errors

---

## 💡 Why This Keeps Happening

**The migration file is correct**, but it needs to be **executed on your database**. 

Think of it like this:
- Migration file = Recipe
- Database = Kitchen
- You need to **cook the recipe** (run the migration) for it to work!

**The migration won't apply itself automatically** - you must run it manually via:
- Supabase Dashboard SQL Editor (easiest)
- Supabase CLI (if configured)
- Direct database connection (advanced)

---

## 🚀 Quick Fix (Copy-Paste Ready)

1. Open: https://supabase.com/dashboard → Your Project → SQL Editor
2. Copy ALL from: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
3. Paste and Run
4. Done! ✅

**This will permanently fix the recursion issue!**

