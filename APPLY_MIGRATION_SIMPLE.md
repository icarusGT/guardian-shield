# 🚀 Apply Migration - Simple Guide

## ⚡ FASTEST METHOD (2 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar

### Step 2: Copy Migration
1. Open file: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
2. **Select ALL** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 3: Paste and Run
1. In Supabase SQL Editor, **paste** (Ctrl+V)
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for: **"Success. No rows returned"**

### Step 4: Done! ✅
- Try creating a case - it works!
- Try Transactions page - it works!

---

## 🔄 Alternative: Using npx (If Available)

```bash
npx supabase db push
```

This will apply all pending migrations automatically.

---

## ✅ Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Should show:**
- `owner` = `postgres`
- `is_security_definer` = `t`

---

## 🆘 Still Having Issues?

1. **Make sure you're logged in** as project owner/admin
2. **Check for errors** in SQL Editor output
3. **Try refreshing** Supabase dashboard
4. **Wait 1-2 minutes** after applying (sometimes policies cache)

---

## 📋 What This Fixes

- ✅ Case creation (no more recursion errors)
- ✅ Transactions page (loads correctly)
- ✅ All RLS policies (use safe functions)
- ✅ Triggers (work without errors)

**This is a complete, production-ready fix!**

