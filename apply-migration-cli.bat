@echo off
REM Automatic Migration Application Script (CLI Method for Windows)
REM This script uses Supabase CLI to apply the migration

echo 🚀 Applying RLS Fix Migration via Supabase CLI...
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found!
    echo.
    echo Installing Supabase CLI...
    npm install -g supabase
    echo.
)

REM Check if we're linked to a project
if not exist "supabase\.temp\project-ref" (
    echo ⚠️  Not linked to a Supabase project.
    echo.
    echo Linking to your project...
    echo You'll need your project reference ID from Supabase Dashboard
    set /p project_ref="Enter your Supabase project reference ID: "
    
    if "%project_ref%"=="" (
        echo ❌ Project reference ID is required!
        exit /b 1
    )
    
    supabase link --project-ref "%project_ref%"
    echo.
)

REM Apply migration
echo 📄 Applying migration: 20260119195850_fraud_off_supabase.sql
echo.

supabase db push

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration applied successfully!
    echo.
    echo 🎉 Your database has been updated with the RLS fixes.
    echo.
    echo Next steps:
    echo   1. Try creating a case - it should work now!
    echo   2. Try accessing the Transactions page - it should work now!
    echo.
) else (
    echo.
    echo ❌ Migration failed!
    echo.
    echo Alternative: Apply migration via Supabase Dashboard:
    echo   1. Go to https://supabase.com/dashboard
    echo   2. Select your project → SQL Editor
    echo   3. Copy contents of: supabase\migrations\20260119195850_fraud_off_supabase.sql
    echo   4. Paste and click Run
    echo.
    exit /b 1
)

