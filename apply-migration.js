#!/usr/bin/env node
// Last updated: 20th January 2025

/**
 * Automatic Migration Application Script
 * This script applies the RLS fix migration to your Supabase database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

// Get Supabase credentials from environment or config
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('');
  console.error('Please set one of the following:');
  console.error('  - VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('You can find these in:');
  console.error('  1. Supabase Dashboard → Settings → API');
  console.error('  2. Create a .env.local file with:');
  console.error('     VITE_SUPABASE_URL=your-project-url');
  console.error('     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('');
  console.error('⚠️  Note: Use SERVICE_ROLE_KEY (not anon key) for migrations');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting migration application...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20260119195850_fraud_off_supabase.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    if (!migrationSQL || migrationSQL.trim().length === 0) {
      throw new Error('Migration file is empty!');
    }

    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Split SQL into individual statements (basic splitting by semicolon)
    // Note: This is a simple approach. For complex SQL, you might need a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute migration using RPC or direct SQL
    // Supabase JS client doesn't support raw SQL execution directly
    // So we'll use the REST API via fetch
    console.log('⚡ Executing migration via Supabase REST API...\n');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: migrationSQL })
    }).catch(async () => {
      // If RPC doesn't exist, try direct SQL execution via pg REST API
      console.log('⚠️  RPC method not available, trying alternative approach...\n');
      
      // Alternative: Execute via Supabase Management API
      // This requires the migration to be applied manually or via CLI
      throw new Error('Direct SQL execution not available via JS client. Please use Supabase CLI or Dashboard.');
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed: ${response.status} ${errorText}`);
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('🎉 Your database has been updated with the RLS fixes.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Try creating a case - it should work now!');
    console.log('  2. Try accessing the Transactions page - it should work now!');
    console.log('');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('');
    console.error('Alternative methods to apply migration:');
    console.error('');
    console.error('Method 1: Supabase Dashboard (Recommended)');
    console.error('  1. Go to https://supabase.com/dashboard');
    console.error('  2. Select your project');
    console.error('  3. Go to SQL Editor');
    console.error('  4. Copy contents of: supabase/migrations/20260119195850_fraud_off_supabase.sql');
    console.error('  5. Paste and click Run');
    console.error('');
    console.error('Method 2: Supabase CLI');
    console.error('  npx supabase db push');
    console.error('');
    process.exit(1);
  }
}

// Run the migration
applyMigration();

