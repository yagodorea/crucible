import { beforeAll, afterAll, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Mock the apiKeyAuth middleware so tests don't hit the api_keys table
const TEST_API_KEY = 'test-key-123';
const TEST_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test User',
    email: 'test@crucible.local',
    createdAt: '2024-01-01T00:00:00.000Z',
};

vi.mock('../middleware/apiKeyAuth.js', () => ({
    validateApiKey: async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }

        if (apiKey !== TEST_API_KEY) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }

        req.user = TEST_USER;
        next();
    },
    checkApiKey: async (apiKey: string) => {
        if (apiKey === TEST_API_KEY) {
            return { valid: true, user: TEST_USER };
        }
        return { valid: false };
    },
}));

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
