<!-- Last updated: 20th January 2025 -->
# 🚀 Apply All Migrations - Complete Setup

## ⚠️ Important: Run Migrations in Order!

You need to apply **TWO migrations** in the correct order:

1. **First**: Base schema migration (creates all tables)
2. **Second**: RLS fix migration (fixes infinite recursion)

---

## 📋 Step-by-Step Instructions

### Step 1: Apply Base Schema Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click **"SQL Editor"** (left sidebar)
   - Click **"New query"**

2. **Copy Base Schema Migration**
   - Open: `supabase/migrations/20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql`
   - Select ALL (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click **"Run"** (or Ctrl+Enter)
   - **Wait for success message** - This may take 30-60 seconds

4. **Verify Tables Created**
   - Run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('fraud_cases', 'users', 'customers', 'transactions');
   ```
   - Should return 4 rows

---

### Step 2: Apply RLS Fix Migration

1. **In the Same SQL Editor**
   - Click **"New query"** (or clear the previous query)

2. **Copy RLS Fix Migration**
   - Open: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
   - Select ALL (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click **"Run"** (or Ctrl+Enter)
   - **Wait for success message**

4. **Done!** ✅

---

## ✅ Verify Everything Works

Run this verification query:

```sql
-- Check if functions are SECURITY DEFINER
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected:**
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

---

## 🎯 Test Your Application

After both migrations:

1. **Go to**: http://localhost:8080/cases/new
2. **Try creating a case** - Should work without errors!
3. **Check other pages** - Transactions, Investigations, etc.

---

## 🆘 Troubleshooting

### "Relation does not exist" error
→ You're running migrations in wrong order. Start with Step 1.

### "Policy does not exist" warnings
→ **This is OK!** The migration uses `DROP POLICY IF EXISTS`, so warnings are safe.

### "Function already exists" warnings
→ **This is OK!** The migration uses `CREATE OR REPLACE`, so it updates existing functions.

### Still getting recursion errors?
→ Make sure Step 2 (RLS fix) was applied successfully. Check the verification query above.

---

## 📝 Migration Order Summary

```
1. 20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql  ← Creates tables
2. 20260119195850_fraud_off_supabase.sql                    ← Fixes RLS
```

**Both must be applied for the application to work!**

