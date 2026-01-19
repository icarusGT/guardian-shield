# Quick Fix Guide - RLS Infinite Recursion

## The Problem
```
Error: infinite recursion detected in policy for relation "fraud_cases"
```

## The Solution (3 Steps)

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar

### Step 2: Copy & Paste Migration
1. Open file: `supabase/migrations/20260119195850_fraud_off_supabase.sql`
2. Copy **ALL** contents (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor (Ctrl+V)

### Step 3: Run Migration
1. Click **Run** button (or press Ctrl+Enter)
2. Wait for "Success. No rows returned" message
3. Done! ✅

## Test It Works
Try creating a case in your app - it should work now!

## What Was Fixed
- ✅ Root cause: `current_role_id()` now bypasses RLS
- ✅ All helper functions fixed automatically
- ✅ All policies updated to use safe functions
- ✅ Triggers can now insert without errors
- ✅ Complete solution - no more recursion!

## Need Help?
See `SUPABASE_RLS_FIX.md` for detailed explanation and troubleshooting.

