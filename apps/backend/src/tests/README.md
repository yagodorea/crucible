# Integration Tests

This directory contains comprehensive integration tests for the Crucible D&D Character Creator API.

## Overview

The integration tests validate all API endpoints with real database connections to ensure the entire system works correctly end-to-end.

## Test Structure

```
src/tests/
├── setup.ts                          # Test setup and configuration
└── integration/
    ├── auth.test.ts                  # Authentication endpoint tests
    ├── users.test.ts                 # User CRUD operation tests
    ├── data.test.ts                  # D&D reference data endpoint tests
    └── characters.test.ts            # Character CRUD operation tests
```

## Test Coverage

### Auth API (`auth.test.ts`)
- ✅ POST /api/auth/validate - Valid API key
- ✅ POST /api/auth/validate - Invalid API key
- ✅ POST /api/auth/validate - Missing API key
- ✅ GET / - Welcome endpoint

### User API (`users.test.ts`)
- ✅ POST /api/users - Create user with valid data
- ✅ POST /api/users - Email normalization (trim & lowercase)
- ✅ POST /api/users - Validation errors
- ✅ GET /api/users - List all users
- ✅ GET /api/users/:id - Get user by ID
- ✅ GET /api/users/:id - 404 for non-existent user
- ✅ All endpoints - Authentication checks

### Data API (`data.test.ts`)
- ✅ GET /api/data/classes - List D&D classes with enriched data
- ✅ GET /api/data/classes - Complexity and primary ability validation
- ✅ GET /api/data/races - List D&D races
- ✅ GET /api/data/backgrounds - List D&D backgrounds
- ✅ All endpoints - Authentication checks

### Character API (`characters.test.ts`)
- ✅ POST /api/characters - Create character with complete data
- ✅ POST /api/characters - Create character with minimal fields
- ✅ GET /api/characters - List all characters
- ✅ GET /api/characters/:id - Get character by ID
- ✅ GET /api/characters/:id - 404 for non-existent character
- ✅ PUT /api/characters/:id - Update character (partial)
- ✅ PUT /api/characters/:id - Update ability scores
- ✅ PUT /api/characters/:id - Update alignment
- ✅ PUT /api/characters/:id - 404 for non-existent character
- ✅ DELETE /api/characters/:id - Delete character
- ✅ DELETE /api/characters/:id - 404 for non-existent character
- ✅ All endpoints - Authentication checks

## Prerequisites

1. **Supabase Database**: Tests connect to a real Supabase instance
2. **Environment Variables**: Set up your `.env` file with:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   API_KEYS=test-key-123
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npx vitest run src/tests/integration/auth.test.ts
```

### Run tests matching a pattern
```bash
npx vitest run -t "should create"
```

## Configuration

The test configuration is defined in `vitest.config.ts`:

- **Environment**: Node.js
- **Globals**: Enabled for describe/it/expect
- **Setup**: Runs `src/tests/setup.ts` before tests
- **Timeout**: 10 seconds per test
- **Coverage**: Configured to exclude test files and generated code

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Tests that create data should clean up after themselves
3. **API Keys**: Use test-specific API keys, never production keys
4. **Assertions**: Use specific assertions to validate exact behavior
5. **Error Cases**: Always test both success and error paths

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    API_KEYS: ${{ secrets.TEST_API_KEYS }}
  run: npm test
```

## Troubleshooting

### Tests failing with connection errors
- Verify your Supabase credentials are correct
- Check that your `.env` file is properly configured
- Ensure your Supabase instance is running and accessible

### Authentication errors
- Verify `API_KEYS` is set in your environment
- The test API key defaults to `test-key-123`
- Check that the middleware is properly configured

### Database errors
- Ensure your Supabase tables have the correct schema
- Verify row-level security policies allow the operations
- Check that the anon key has sufficient permissions

## Future Enhancements

- [ ] Add performance benchmarks
- [ ] Add load testing
- [ ] Mock Supabase for faster unit tests
- [ ] Add test data factories for easier test setup
- [ ] Add API contract testing
