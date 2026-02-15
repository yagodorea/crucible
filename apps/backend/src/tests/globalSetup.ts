import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function cleanupTestData() {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
    );

    // Delete test users (all test users use @example.com emails)
    const { error: usersError } = await supabase
        .from('users')
        .delete()
        .like('email', '%@example.com');

    if (usersError) {
        console.error('Failed to clean up test users:', usersError.message);
    }

    // Delete test characters by known test names
    const { error: charsError } = await supabase
        .from('characters')
        .delete()
        .in('name', ['Thorin Oakenshield', 'Thorin Oakenshield Updated', 'Simple Character']);

    if (charsError) {
        console.error('Failed to clean up test characters:', charsError.message);
    }
}

export async function setup() {
    // Clean up leftover data from previous failed runs
    await cleanupTestData();
    console.log('✓ Pre-test cleanup complete');
}

export async function teardown() {
    // Clean up all test data after the suite finishes
    await cleanupTestData();
    console.log('✓ Post-test cleanup complete');
}
