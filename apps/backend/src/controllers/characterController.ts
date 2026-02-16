import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { supabase } from '../config/database.js';
import {
  DbCharacterWithCreator,
  CharacterInput,
  toCharacterResponse,
  toDbInsert,
  toDbUpdate
} from '../models/Character.js';

export const getAllCharacters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*, users(name)');

    if (error) throw error;

    const characters = (data as DbCharacterWithCreator[]).map(toCharacterResponse);
    res.json(characters);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getCharacterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*, users(name)')
      .eq('character_id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Character not found' });
        return;
      }
      throw error;
    }

    res.json(toCharacterResponse(data as DbCharacterWithCreator));
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const createCharacter = async (req: Request, res: Response): Promise<void> => {
  try {
    const characterId = nanoid(8);
    const input: CharacterInput = req.body;
    const userId = req.user?.id;
    const dbData = toDbInsert(input, characterId, userId);

    const { data, error } = await supabase
      .from('characters')
      .insert(dbData)
      .select('*, users(name)')
      .single();

    if (error) throw error;

    res.status(201).json(toCharacterResponse(data as DbCharacterWithCreator));
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Unknown error occurred' });
    }
  }
};

export const updateCharacter = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = toDbUpdate(req.body);

    const { data, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('character_id', req.params.id)
      .select('*, users(name)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Character not found' });
        return;
      }
      throw error;
    }

    res.json(toCharacterResponse(data as DbCharacterWithCreator));
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Unknown error occurred' });
    }
  }
};

export const deleteCharacter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('characters')
      .delete()
      .eq('character_id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Character not found' });
        return;
      }
      throw error;
    }

    if (!data) {
      res.status(404).json({ message: 'Character not found' });
      return;
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};
