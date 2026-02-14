import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Ensure env vars are loaded before accessing them
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const errorMessage = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables';

  // In test environment, throw an error instead of exiting
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    throw new Error(errorMessage);
  }

  console.error(errorMessage);
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const testConnection = async (): Promise<void> => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Supabase connection error: ${error.message}`);
    } else {
      console.error('Unknown error occurred during Supabase connection');
    }
    process.exit(1);
  }
};
