# 🚀 Automatic Migration Application

This guide shows you how to automatically apply the RLS fix migration to your Supabase database.

## ⚡ Quick Start (Choose One Method)

### Method 1: Supabase CLI (Recommended - Easiest)

**Windows:**
```bash
apply-migration-cli.bat
```

**Mac/Linux:**
```bash
chmod +x apply-migration-cli.sh
./apply-migration-cli.sh
```

**Or use npm script:**
```bash
npm run migrate:cli
```

### Method 2: Node.js Script (If you have Supabase credentials)

1. Create `.env.local` file with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Run:
```bash
npm run migrate:apply
```

### Method 3: Manual (Most Reliable)

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/20260119195850_fraud_off_supabase.sql`
3. Paste and click **Run**

## 📋 Prerequisites

### For Supabase CLI Method:
- Node.js installed
- Supabase CLI installed (script will install if missing)
- Linked to your Supabase project (script will guide you)

### For Node.js Script Method:
- Node.js installed
- `.env.local` file with Supabase credentials
- Service Role Key (not anon key) - found in Supabase Dashboard → Settings → API

## 🔍 Getting Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **service_role key** (secret) → Use as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important:** Use the `service_role` key, NOT the `anon` key for migrations!

## ✅ Verification

After applying the migration, verify it worked:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  proname as function_name,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected Result:**
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

## 🆘 Troubleshooting

### "Supabase CLI not found"
```bash
npm install -g supabase
```

### "Not linked to project"
```bash
supabase link --project-ref your-project-ref
```

### "Missing credentials"
- Create `.env.local` file with your Supabase credentials
- See "Getting Your Supabase Credentials" above

### "Migration failed"
- Check Supabase Dashboard → Logs for errors
- Try manual method (Method 3) - it's the most reliable

## 🎯 What Gets Fixed

After applying this migration:
- ✅ Case creation will work (no more recursion errors)
- ✅ Transactions page will work
- ✅ All RLS policies will use safe functions
- ✅ Triggers will work correctly

## 📝 Files Created

- `apply-migration.js` - Node.js script (requires credentials)
- `apply-migration-cli.sh` - Bash script for Mac/Linux
- `apply-migration-cli.bat` - Batch script for Windows
- `AUTO_APPLY_MIGRATION.md` - This guide

## 🚀 Next Steps

After migration is applied:
1. Test creating a case - should work!
2. Test Transactions page - should work!
3. All RLS recursion issues should be resolved!

