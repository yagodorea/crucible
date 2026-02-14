import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { CharacterInput } from '../../models/Character.js';

describe('Character API Integration Tests', () => {
  const validApiKey = 'test-key-123';
  let createdCharacterId: string;

  const sampleCharacter: CharacterInput = {
    name: 'Thorin Oakenshield',
    class: 'Fighter',
    background: 'Noble',
    species: 'Dwarf',
    level: 5,
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 11,
      charisma: 13
    },
    alignment: {
      lawChaos: 'lawful',
      goodEvil: 'good'
    },
    languages: ['Common', 'Dwarvish'],
    appearance: 'A stout dwarf with a long braided beard',
    lore: 'Former king under the mountain'
  };

  describe('POST /api/characters', () => {
    it('should create a new character with complete data', async () => {
      const response = await request(app)
        .post('/api/characters')
        .set('X-Api-Key', validApiKey)
        .send(sampleCharacter)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('characterId');
      expect(response.body.name).toBe(sampleCharacter.name);
      expect(response.body.class).toBe(sampleCharacter.class);
      expect(response.body.background).toBe(sampleCharacter.background);
      expect(response.body.species).toBe(sampleCharacter.species);
      expect(response.body.level).toBe(sampleCharacter.level);
      expect(response.body.abilityScores).toEqual(sampleCharacter.abilityScores);
      expect(response.body.alignment).toEqual(sampleCharacter.alignment);
      expect(response.body.languages).toEqual(sampleCharacter.languages);
      expect(response.body.appearance).toBe(sampleCharacter.appearance);
      expect(response.body.lore).toBe(sampleCharacter.lore);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdCharacterId = response.body.characterId;
    });

    it('should create a character with minimal required fields', async () => {
      const minimalCharacter: CharacterInput = {
        name: 'Simple Character',
        class: 'Rogue',
        background: 'Criminal',
        species: 'Human',
        level: 1,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        alignment: {
          lawChaos: 'neutral',
          goodEvil: 'neutral'
        }
      };

      const response = await request(app)
        .post('/api/characters')
        .set('X-Api-Key', validApiKey)
        .send(minimalCharacter)
        .expect(201);

      expect(response.body.name).toBe(minimalCharacter.name);
      expect(response.body.languages).toEqual([]);
      expect(response.body.appearance).toBeUndefined();
      expect(response.body.lore).toBeUndefined();
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .post('/api/characters')
        .send(sampleCharacter)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .post('/api/characters')
        .set('X-Api-Key', 'invalid-key')
        .send(sampleCharacter)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/characters', () => {
    it('should return an array of characters', async () => {
      const response = await request(app)
        .get('/api/characters')
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const character = response.body[0];
        expect(character).toHaveProperty('id');
        expect(character).toHaveProperty('characterId');
        expect(character).toHaveProperty('name');
        expect(character).toHaveProperty('class');
        expect(character).toHaveProperty('background');
        expect(character).toHaveProperty('species');
        expect(character).toHaveProperty('level');
        expect(character).toHaveProperty('abilityScores');
        expect(character).toHaveProperty('alignment');
        expect(character).toHaveProperty('languages');
        expect(character).toHaveProperty('createdAt');
        expect(character).toHaveProperty('updatedAt');
      }
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/characters')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should return a character by characterId', async () => {
      if (!createdCharacterId) {
        return;
      }

      const response = await request(app)
        .get(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(response.body.characterId).toBe(createdCharacterId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('class');
      expect(response.body).toHaveProperty('abilityScores');
      expect(response.body).toHaveProperty('alignment');
    });

    it('should return 404 when character is not found', async () => {
      const fakeId = 'nonexist';

      const response = await request(app)
        .get(`/api/characters/${fakeId}`)
        .set('X-Api-Key', validApiKey)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Character not found');
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .get('/api/characters/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .get('/api/characters/some-id')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('PUT /api/characters/:id', () => {
    it('should update a character with partial data', async () => {
      if (!createdCharacterId) {
        return;
      }

      const updateData = {
        name: 'Thorin Oakenshield Updated',
        level: 6,
        lore: 'Now reclaimed the mountain'
      };

      const response = await request(app)
        .put(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .send(updateData)
        .expect(200);

      expect(response.body.characterId).toBe(createdCharacterId);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.level).toBe(updateData.level);
      expect(response.body.lore).toBe(updateData.lore);
      // Other fields should remain unchanged
      expect(response.body.class).toBe(sampleCharacter.class);
      expect(response.body.species).toBe(sampleCharacter.species);
    });

    it('should update ability scores', async () => {
      if (!createdCharacterId) {
        return;
      }

      const updateData = {
        abilityScores: {
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 12,
          wisdom: 13,
          charisma: 15
        }
      };

      const response = await request(app)
        .put(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .send(updateData)
        .expect(200);

      expect(response.body.abilityScores).toEqual(updateData.abilityScores);
    });

    it('should update alignment', async () => {
      if (!createdCharacterId) {
        return;
      }

      const updateData = {
        alignment: {
          lawChaos: 'neutral' as const,
          goodEvil: 'good' as const
        }
      };

      const response = await request(app)
        .put(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .send(updateData)
        .expect(200);

      expect(response.body.alignment).toEqual(updateData.alignment);
    });

    it('should return 404 when character is not found', async () => {
      const fakeId = 'nonexist';

      const response = await request(app)
        .put(`/api/characters/${fakeId}`)
        .set('X-Api-Key', validApiKey)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Character not found');
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .put('/api/characters/some-id')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .put('/api/characters/some-id')
        .set('X-Api-Key', 'invalid-key')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should delete a character', async () => {
      if (!createdCharacterId) {
        return;
      }

      const response = await request(app)
        .delete(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Character deleted successfully');

      // Verify the character is actually deleted
      await request(app)
        .get(`/api/characters/${createdCharacterId}`)
        .set('X-Api-Key', validApiKey)
        .expect(404);
    });

    it('should return 404 when trying to delete non-existent character', async () => {
      const fakeId = 'nonexist';

      const response = await request(app)
        .delete(`/api/characters/${fakeId}`)
        .set('X-Api-Key', validApiKey)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Character not found');
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .delete('/api/characters/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .delete('/api/characters/some-id')
        .set('X-Api-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });
});
