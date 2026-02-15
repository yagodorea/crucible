import axios from 'axios';
import type { Character, ClassInfo, ClassDetailInfo, SubclassDetailInfo, RaceInfo, RaceDetailInfo, BackgroundInfo, BackgroundDetailInfo } from '../types/character';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const STORAGE_KEY = 'dnd-api-key';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to all requests
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem(STORAGE_KEY);
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// Handle 401 responses by clearing auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const dataAPI = {
  getClasses: async (): Promise<ClassInfo[]> => {
    const response = await api.get('/data/classes');
    return response.data;
  },

  getClassDetail: async (className: string): Promise<ClassDetailInfo> => {
    const response = await api.get(`/data/classes/${className}`);
    return response.data;
  },

  getSubclassDetail: async (className: string, subclassName: string): Promise<SubclassDetailInfo> => {
    const response = await api.get(`/data/classes/${className}/subclasses/${encodeURIComponent(subclassName)}`);
    return response.data;
  },

  getRaces: async (): Promise<RaceInfo[]> => {
    const response = await api.get('/data/races');
    return response.data;
  },

  getRaceDetail: async (raceName: string): Promise<RaceDetailInfo> => {
    const response = await api.get(`/data/races/${encodeURIComponent(raceName)}`);
    return response.data;
  },

  getBackgrounds: async (): Promise<BackgroundInfo[]> => {
    const response = await api.get('/data/backgrounds');
    return response.data;
  },

  getBackgroundDetail: async (backgroundName: string): Promise<BackgroundDetailInfo> => {
    const response = await api.get(`/data/backgrounds/${encodeURIComponent(backgroundName)}`);
    return response.data;
  },

  getSources: async (): Promise<string[]> => {
    const response = await api.get('/data/sources');
    return response.data;
  },
};

export const characterAPI = {
  getAll: async (): Promise<Character[]> => {
    const response = await api.get('/characters');
    return response.data;
  },

  getById: async (id: string): Promise<Character> => {
    const response = await api.get(`/characters/${id}`);
    return response.data;
  },

  create: async (character: Omit<Character, 'characterId' | 'createdAt' | 'updatedAt'>): Promise<Character> => {
    const response = await api.post('/characters', character);
    return response.data;
  },

  update: async (id: string, character: Partial<Character>): Promise<Character> => {
    const response = await api.put(`/characters/${id}`, character);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/characters/${id}`);
  },
};

export default api;
