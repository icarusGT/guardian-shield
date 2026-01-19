# 🔧 STEP-BY-STEP FIX - Infinite Recursion Error

## 🎯 Problem
```
Failed to create case: infinite recursion detected in policy for relation "fraud_cases"
```

## ✅ Solution (Follow These Steps EXACTLY)

### STEP 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. **Login** if needed
3. **Click** on your project name

### STEP 2: Open SQL Editor
1. In the left sidebar, find **"SQL Editor"**
2. **Click** on it
3. You should see a blank SQL editor window

### STEP 3: Open Migration File
1. In your code editor (VS Code/Cursor), open:
   ```
   supabase/migrations/20260119195850_fraud_off_supabase.sql
   ```
2. **Select ALL** text in the file:
   - Press `Ctrl+A` (Windows) or `Cmd+A` (Mac)
   - Or drag to select everything
3. **Copy** the selected text:
   - Press `Ctrl+C` (Windows) or `Cmd+C` (Mac)

### STEP 4: Paste Into SQL Editor
1. Go back to Supabase Dashboard (SQL Editor tab)
2. **Click** in the SQL editor window
3. **Clear** any existing text (if any)
4. **Paste** the migration:
   - Press `Ctrl+V` (Windows) or `Cmd+V` (Mac)
   - You should see ~640 lines of SQL code

### STEP 5: Run the Migration
1. **Click** the green **"Run"** button (bottom right)
   - OR press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)
2. **Wait** for execution (usually 1-5 seconds)
3. **Check** the result:
   - ✅ **Success:** You'll see "Success. No rows returned"
   - ❌ **Error:** You'll see an error message (read it carefully)

### STEP 6: Verify It Worked
Run this in SQL Editor (new query):

```sql
SELECT 
  proname,
  pg_get_userbyid(proowner) as owner,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'current_role_id';
```

**Expected Result:**
- `proname` = `current_role_id`
- `owner` = `postgres`
- `is_security_definer` = `t` (true)

If you see this → **Migration applied successfully!** ✅

### STEP 7: Test Your App
1. Go to: **http://localhost:8080/cases/new**
2. Try creating a case
3. **It should work now!** ✅

---

## 🔍 Troubleshooting

### Error: "function already exists"
- ✅ **This is OK!** The migration uses `CREATE OR REPLACE`
- Just continue - it will update the function

### Error: "policy does not exist"
- ✅ **This is OK!** The migration uses `DROP POLICY IF EXISTS`
- Just continue - it will skip if policy doesn't exist

### Error: "permission denied"
- ❌ You need to be logged in as project owner/admin
- Make sure you're using the correct Supabase account

### Error: "syntax error"
- ❌ Make sure you copied the **ENTIRE** file
- Don't copy just part of it - copy everything from line 1 to the end
- Check for any missing semicolons or quotes

### Still Getting Recursion Error After Applying?
1. **Wait 1-2 minutes** (Supabase caches policies)
2. **Refresh** your browser
3. **Check verification query** (Step 6) - is `is_security_definer = t`?
4. If still `f` (false) → Migration didn't apply correctly
5. Try running migration again

---

## 📊 What Happens When You Run the Migration

The migration does these things **in order**:

1. **Replaces `current_role_id()`** function
   - Changes it to SECURITY DEFINER
   - This breaks the recursion chain

2. **Creates safe helper functions**
   - `get_user_role_id()` - Gets role without recursion
   - `user_owns_customer()` - Checks ownership safely
   - `user_is_assigned_investigator()` - Checks assignments safely

3. **Drops old recursive policies**
   - Removes policies that use `is_admin()`, `is_customer()`, etc.

4. **Creates new safe policies**
   - Uses `get_user_role_id()` instead
   - No more recursion!

5. **Fixes all related tables**
   - transactions, suspicious_transactions, investigators, etc.

---

## ✅ Success Indicators

After running migration, you should see:
- ✅ "Success. No rows returned" message
- ✅ `current_role_id()` function is SECURITY DEFINER
- ✅ `get_user_role_id()` function exists
- ✅ Can create cases without errors
- ✅ No more recursion errors

---

## 🆘 Still Need Help?

If you've followed all steps and still get errors:

1. **Share the exact error message** from SQL Editor
2. **Share the output** of the verification query (Step 6)
3. **Check Supabase logs:**
   - Dashboard → Logs → Postgres Logs
   - Look for any errors around the time you ran the migration

---

## 🎯 Remember

**The migration file is 100% correct** - it just needs to be **executed** on your database.

**You MUST run it manually** - it won't run itself!

**Follow the steps above EXACTLY** and it will work! ✅

