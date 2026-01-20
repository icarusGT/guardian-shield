<!-- Last updated: 20th January 2025 -->
# ⚡ Quick Start - Apply Migrations

## 🎯 You Need to Apply 2 Migrations

The error `relation "public.fraud_cases" does not exist` means you need to create the tables first!

---

## ✅ Solution: Apply Both Migrations

### Migration 1: Base Schema (Creates Tables)
**File**: `supabase/migrations/20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql`

### Migration 2: RLS Fix (Fixes Recursion)
**File**: `supabase/migrations/20260119195850_fraud_off_supabase.sql`

---

## 🚀 How to Apply (Supabase Dashboard)

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project
- Click **"SQL Editor"**

### 2. Apply Migration 1 (Base Schema)
- Click **"New query"**
- Open: `supabase/migrations/20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql`
- Copy ALL (Ctrl+A, Ctrl+C)
- Paste in SQL Editor (Ctrl+V)
- Click **"Run"**
- ⏳ Wait for success (30-60 seconds)

### 3. Apply Migration 2 (RLS Fix)
- Click **"New query"** again
- Open: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
- Copy ALL (Ctrl+A, Ctrl+C)
- Paste in SQL Editor (Ctrl+V)
- Click **"Run"**
- ✅ Done!

---

## ✅ Verify It Worked

Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'fraud_cases';
```

Should return 1 row. If it does → **Tables exist!** ✅

Then test your app:
- Go to: http://localhost:8080/cases/new
- Try creating a case - should work!

---

## 🆘 Still Having Issues?

1. **Make sure Migration 1 completed successfully** before running Migration 2
2. **Check for error messages** in SQL Editor
3. **Wait a few seconds** between migrations
4. **Refresh your browser** after applying migrations

