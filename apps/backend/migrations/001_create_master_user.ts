import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  // 1. Create api_keys table if it doesn't exist
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_hash TEXT NOT NULL UNIQUE,
        label TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_used_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    `,
  });

  if (tableError) {
    // Table may already exist or RPC may not be available — try inserting directly
    console.warn('Note: Could not run CREATE TABLE via RPC (table may already exist):', tableError.message);
  }

  // 2. Upsert master user
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert({ name: 'Master', email: 'master@crucible.local' }, { onConflict: 'email' })
    .select()
    .single();

  if (userError || !user) {
    console.error('Failed to create master user:', userError?.message);
    process.exit(1);
  }

  console.log(`Master user: ${user.id} (${user.email})`);

  // 3. Generate API key
  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // 4. Insert API key
  const { error: keyError } = await supabase
    .from('api_keys')
    .insert({ user_id: user.id, key_hash: keyHash, label: 'master-key' });

  if (keyError) {
    console.error('Failed to insert API key:', keyError.message);
    process.exit(1);
  }

  console.log('\n=== Master API Key (save this — it cannot be recovered) ===');
  console.log(rawKey);
  console.log('===========================================================\n');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
