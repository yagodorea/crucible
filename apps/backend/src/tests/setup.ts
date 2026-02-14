import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment variables at module level, BEFORE any test imports
// This ensures credentials are available when database.ts is imported
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verify required environment variables are present
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY\n' +
    'Please ensure apps/backend/.env file exists with these variables set.'
  );
}

beforeAll(() => {
  // Setup runs before all tests
  console.log('✓ Test environment initialized');
});

afterAll(() => {
  // Cleanup if needed
});
