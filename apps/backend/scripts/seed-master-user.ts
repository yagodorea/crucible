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

/**
 * Seeds the database with a master user and API key.
 * Requires the schema from supabase-schema.sql to be applied first.
 */
async function seed() {
  // 1. Upsert master user
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

  // 2. Generate API key
  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // 3. Insert API key
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

seed().catch((err: Error) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
