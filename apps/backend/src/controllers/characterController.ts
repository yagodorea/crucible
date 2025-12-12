import { Request, Response } from 'express';
import Character from '../models/Character.js';
import { nanoid } from 'nanoid';

export const getAllCharacters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const characters = await Character.find().select('-__v');
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
    const character = await Character.findOne({ characterId: req.params.id }).select('-__v');
    if (!character) {
      res.status(404).json({ message: 'Character not found' });
      return;
    }
    res.json(character);
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
    // Generate a short, memorable ID (8 characters)
    const characterId = nanoid(8);

    const character = new Character({
      ...req.body,
      characterId
    });

    const newCharacter = await character.save();
    res.status(201).json(newCharacter);
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
    const character = await Character.findOneAndUpdate(
      { characterId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!character) {
      res.status(404).json({ message: 'Character not found' });
      return;
    }

    res.json(character);
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
    const character = await Character.findOneAndDelete({ characterId: req.params.id });

    if (!character) {
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
