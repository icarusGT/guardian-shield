# 🚨 DO THIS NOW - Apply Base Schema Migration

## ✅ Current Status
- You verified: Tables don't exist yet
- Next step: Apply base schema migration to CREATE the tables

---

## 📋 Step-by-Step Instructions

### Step 1: Open Base Schema Migration File
**File path**: `supabase/migrations/20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql`

Open this file in your code editor (it's in your project folder).

### Step 2: Copy ALL Contents
1. Click anywhere in the file
2. Press **Ctrl+A** (select all)
3. Press **Ctrl+C** (copy)

### Step 3: Paste in Supabase SQL Editor
1. Go back to Supabase Dashboard SQL Editor
2. Click **"New query"** button (top right) OR clear the current query
3. Click in the editor area
4. Press **Ctrl+V** (paste)
5. You should see the entire migration SQL (it's a long file, ~1153 lines)

### Step 4: Run the Migration
1. Click the **"Run"** button (green button, bottom right)
   - OR press **Ctrl+Enter**
2. ⏳ **Wait 30-60 seconds** - This is a large migration!
3. Look for: **"Success"** message

### Step 5: Verify Tables Were Created
Run this query again:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fraud_cases', 'users', 'customers', 'transactions')
ORDER BY table_name;
```

**Expected**: Should return **4 rows** (one for each table)

---

## ⚠️ Important Notes

- **This migration is LONG** (~1153 lines) - that's normal!
- **It may take 30-60 seconds** to run - be patient!
- **Ignore warnings** about "policy does not exist" - that's OK
- **Don't interrupt** the migration while it's running

---

## 🔄 After Base Schema Migration Succeeds

Then apply the RLS fix migration:
- File: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
- Same process: Copy → Paste → Run

---

## ✅ Success Checklist

After both migrations:
- [ ] Base schema migration completed successfully
- [ ] Verification query returns 4 rows
- [ ] RLS fix migration completed successfully
- [ ] Can create cases at `/cases/new` without errors

