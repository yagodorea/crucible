import { Request, Response } from 'express';
import dataService from '../services/dataService.js';

export const getClasses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const classes = await dataService.getClasses();

    // Transform to include complexity from the character creation table
    const complexityMap: Record<string, {primaryAbility: string; complexity: string}> = {
      'Barbarian': { primaryAbility: 'Strength', complexity: 'Average' },
      'Bard': { primaryAbility: 'Charisma', complexity: 'High' },
      'Cleric': { primaryAbility: 'Wisdom', complexity: 'Average' },
      'Druid': { primaryAbility: 'Wisdom', complexity: 'High' },
      'Fighter': { primaryAbility: 'Strength or Dexterity', complexity: 'Low' },
      'Monk': { primaryAbility: 'Dexterity and Wisdom', complexity: 'High' },
      'Paladin': { primaryAbility: 'Strength and Charisma', complexity: 'Average' },
      'Ranger': { primaryAbility: 'Dexterity and Wisdom', complexity: 'Average' },
      'Rogue': { primaryAbility: 'Dexterity', complexity: 'Low' },
      'Sorcerer': { primaryAbility: 'Charisma', complexity: 'High' },
      'Warlock': { primaryAbility: 'Charisma', complexity: 'High' },
      'Wizard': { primaryAbility: 'Intelligence', complexity: 'Average' }
    };

    const enrichedClasses = classes.map(c => ({
      ...c,
      primaryAbility: complexityMap[c.name]?.primaryAbility || '',
      complexity: complexityMap[c.name]?.complexity || 'Average'
    }));

    res.json(enrichedClasses);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getRaces = async (_req: Request, res: Response): Promise<void> => {
  try {
    const races = await dataService.getRaces();
    res.json(races);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getSources = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sources = await dataService.getSources();
    res.json(sources);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getBackgrounds = async (_req: Request, res: Response): Promise<void> => {
  try {
    const backgrounds = await dataService.getBackgrounds();
    res.json(backgrounds);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};
