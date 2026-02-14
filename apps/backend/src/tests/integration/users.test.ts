import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('User API Integration Tests', () => {
  const validApiKey = 'test-key-123';
  let createdUserId: string;

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'Test User',
        email: `testuser-${timestamp}@example.com`
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-Api-Key', validApiKey)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(response.body).toHaveProperty('email', userData.email.toLowerCase());
      expect(response.body).toHaveProperty('createdAt');

      createdUserId = response.body.id;
    });

    it('should trim and lowercase email', async () => {
      const timestamp = Date.now();
      const userData = {
        name: '  Test User 2  ',
        email: `  TestUser2-${timestamp}@EXAMPLE.COM  `
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-Api-Key', validApiKey)
        .send(userData)
        .expect(201);

      expect(response.body.name).toBe('Test User 2');
      expect(response.body.email).toBe(`testuser2-${timestamp}@example.com`);
    });

    it('should return 400 when name is missing', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-Api-Key', validApiKey)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Name and email are required');
    });

    it('should return 400 when email is missing', async () => {
      const userData = {
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-Api-Key', validApiKey)
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Name and email are required');
    });

    it('should return 401 when API key is missing', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .set('X-Api-Key', 'invalid-key')
        .send(userData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/users', () => {
    it('should return an array of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('email');
        expect(response.body[0]).toHaveProperty('createdAt');
      }
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by ID', async () => {
      if (!createdUserId) {
        // Skip if no user was created
        return;
      }

      const response = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 404 when user is not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('X-Api-Key', validApiKey)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/users/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/users/some-id')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });
});
