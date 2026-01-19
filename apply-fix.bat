@echo off
echo ============================================================================
echo RLS Infinite Recursion Fix - Application Script
echo ============================================================================
echo.

echo Checking Supabase CLI...
npx supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Supabase CLI not found!
    echo.
    echo Please use Method 1 (Supabase Dashboard) instead:
    echo   1. Go to https://supabase.com/dashboard
    echo   2. Select your project
    echo   3. Click SQL Editor
    echo   4. Copy contents of: supabase\migrations\20260119195850_fraud_off_supabase.sql
    echo   5. Paste and click Run
    echo.
    pause
    exit /b 1
)

echo [OK] Supabase CLI found
echo.

echo Checking if logged in...
npx supabase projects list >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Not logged in. Starting login process...
    echo.
    echo This will open your browser to authenticate.
    echo.
    npx supabase login
    if %errorlevel% neq 0 (
        echo [ERROR] Login failed!
        echo.
        echo Please use Method 1 (Supabase Dashboard) instead.
        echo See FIX_NOW.md for instructions.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Checking project link...
npx supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Project not linked. Linking now...
    echo.
    npx supabase link --project-ref zxzzowrpphitjbeillcp
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to link project!
        echo.
        echo Please use Method 1 (Supabase Dashboard) instead.
        echo See FIX_NOW.md for instructions.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ============================================================================
echo Applying migration...
echo ============================================================================
echo.

npx supabase db push

if %errorlevel% equ 0 (
    echo.
    echo ============================================================================
    echo [SUCCESS] Migration applied successfully!
    echo ============================================================================
    echo.
    echo Next steps:
    echo   1. Go to http://localhost:8080/cases/new
    echo   2. Try creating a case - it should work now!
    echo.
    echo To verify, run this in Supabase SQL Editor:
    echo   SELECT proname, pg_get_userbyid(proowner) as owner, prosecdef
    echo   FROM pg_proc WHERE proname = 'current_role_id';
    echo   ^(Should show owner=postgres, prosecdef=t^)
    echo.
) else (
    echo.
    echo ============================================================================
    echo [ERROR] Migration failed!
    echo ============================================================================
    echo.
    echo Please use Method 1 (Supabase Dashboard) instead:
    echo   1. Go to https://supabase.com/dashboard
    echo   2. Select your project
    echo   3. Click SQL Editor
    echo   4. Copy contents of: supabase\migrations\20260119195850_fraud_off_supabase.sql
    echo   5. Paste and click Run
    echo.
    echo See FIX_NOW.md for detailed instructions.
    echo.
)

pause

