import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Ensure env vars are loaded before accessing them
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
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
