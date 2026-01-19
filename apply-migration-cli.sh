#!/bin/bash

# Automatic Migration Application Script (CLI Method)
# This script uses Supabase CLI to apply the migration

echo "🚀 Applying RLS Fix Migration via Supabase CLI..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Installing Supabase CLI..."
    npm install -g supabase
    echo ""
fi

# Check if we're linked to a project
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "⚠️  Not linked to a Supabase project."
    echo ""
    echo "Linking to your project..."
    echo "You'll need your project reference ID from Supabase Dashboard"
    read -p "Enter your Supabase project reference ID: " project_ref
    
    if [ -z "$project_ref" ]; then
        echo "❌ Project reference ID is required!"
        exit 1
    fi
    
    supabase link --project-ref "$project_ref"
    echo ""
fi

# Apply migration
echo "📄 Applying migration: 20260119195850_fraud_off_supabase.sql"
echo ""

supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎉 Your database has been updated with the RLS fixes."
    echo ""
    echo "Next steps:"
    echo "  1. Try creating a case - it should work now!"
    echo "  2. Try accessing the Transactions page - it should work now!"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "Alternative: Apply migration via Supabase Dashboard:"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project → SQL Editor"
    echo "  3. Copy contents of: supabase/migrations/20260119195850_fraud_off_supabase.sql"
    echo "  4. Paste and click Run"
    echo ""
    exit 1
fi

