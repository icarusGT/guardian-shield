# 🚨 Apply Base Schema Migration First!

## Current Status
✅ You verified: `fraud_cases` table does NOT exist  
❌ This means: Base schema migration hasn't been applied yet

---

## ⚡ Apply Base Schema Migration NOW

### Step 1: Open the Base Schema Migration File
**File**: `supabase/migrations/20260119182716_d5d92f92-1fc8-43d1-9b02-9565dee4e253.sql`

This migration creates:
- ✅ All tables (fraud_cases, users, customers, transactions, etc.)
- ✅ All functions (current_role_id, is_admin, etc.)
- ✅ All RLS policies (initial version)
- ✅ All triggers

### Step 2: Copy Entire File
1. Open the file in your editor
2. Select ALL (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Paste in Supabase SQL Editor
1. Go back to Supabase Dashboard SQL Editor
2. Click **"New query"** (or clear current query)
3. Paste (Ctrl+V)
4. Click **"Run"** button (or Ctrl+Enter)

### Step 4: Wait for Success
- ⏳ This may take 30-60 seconds
- ✅ Look for: **"Success. No rows returned"** or similar success message
- ⚠️ Ignore warnings about "policy does not exist" - that's normal

---

## ✅ Verify Tables Were Created

After Migration 1 completes, run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fraud_cases', 'users', 'customers', 'transactions')
ORDER BY table_name;
```

**Expected Result**: Should return 4 rows (one for each table)

---

## 🔄 Then Apply RLS Fix Migration

**ONLY AFTER** Migration 1 succeeds:

1. Click **"New query"** in SQL Editor
2. Open: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
3. Copy ALL (Ctrl+A, Ctrl+C)
4. Paste and Run
5. ✅ Done!

---

## 🎯 Final Test

After BOTH migrations:
- Go to: http://localhost:8080/cases/new
- Try creating a case - should work! ✅

