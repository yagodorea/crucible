import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('Auth API Integration Tests', () => {
  const validApiKey = 'test-key-123';
  const invalidApiKey = 'invalid-key';

  beforeAll(() => {
    // Set API keys for testing
    process.env.API_KEYS = validApiKey;
  });

  describe('POST /api/auth/validate', () => {
    it('should return valid:true for a valid API key', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .send({ apiKey: validApiKey })
        .expect(200);

      expect(response.body).toEqual({ valid: true });
    });

    it('should return valid:false for an invalid API key', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .send({ apiKey: invalidApiKey })
        .expect(200);

      expect(response.body).toEqual({ valid: false });
    });

    it('should return 400 when API key is missing', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 400 when API key is null', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .send({ apiKey: null })
        .expect(400);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 400 when API key is empty string', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .send({ apiKey: '' })
        .expect(400);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error', 'API key required');
    });
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Welcome to Crucible D&D Character Creator API'
      });
    });
  });
});
