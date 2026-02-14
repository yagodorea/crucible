import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('Data API Integration Tests', () => {
  const validApiKey = 'test-key-123';

  describe('GET /api/data/classes', () => {
    it('should return an array of classes with enriched data', async () => {
      const response = await request(app)
        .get('/api/data/classes')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const classItem = response.body[0];
        expect(classItem).toHaveProperty('name');
        expect(classItem).toHaveProperty('source');
        expect(classItem).toHaveProperty('primaryAbility');
        expect(classItem).toHaveProperty('complexity');
      }
    });

    it('should include known classes with correct complexity data', async () => {
      const response = await request(app)
        .get('/api/data/classes')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      // Check for specific classes
      const fighter = response.body.find((c: any) => c.name === 'Fighter');
      if (fighter) {
        expect(fighter.complexity).toBe('Low');
        expect(fighter.primaryAbility).toBe('Strength or Dexterity');
      }

      const wizard = response.body.find((c: any) => c.name === 'Wizard');
      if (wizard) {
        expect(wizard.complexity).toBe('Average');
        expect(wizard.primaryAbility).toBe('Intelligence');
      }

      const bard = response.body.find((c: any) => c.name === 'Bard');
      if (bard) {
        expect(bard.complexity).toBe('High');
        expect(bard.primaryAbility).toBe('Charisma');
      }
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/data/classes')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/data/classes')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/data/races', () => {
    it('should return an array of races', async () => {
      const response = await request(app)
        .get('/api/data/races')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const race = response.body[0];
        expect(race).toHaveProperty('name');
        expect(race).toHaveProperty('source');
      }
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/data/races')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/data/races')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/data/backgrounds', () => {
    it('should return an array of backgrounds', async () => {
      const response = await request(app)
        .get('/api/data/backgrounds')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const background = response.body[0];
        expect(background).toHaveProperty('name');
        expect(background).toHaveProperty('source');
      }
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/data/backgrounds')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/data/backgrounds')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });
});
