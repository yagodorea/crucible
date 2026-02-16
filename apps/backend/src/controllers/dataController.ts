import { Request, Response } from 'express';
import dataService from '../services/dataService.js';

export const getClasses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const classes = await dataService.getClasses();
    res.json(classes);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getClassDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { className } = req.params;
    const detail = await dataService.getClassDetail(className.toLowerCase());
    if (!detail) {
      res.status(404).json({ message: 'Class not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getSubclassDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { className, subclassName } = req.params;
    const detail = await dataService.getSubclassDetail(className.toLowerCase(), subclassName);
    if (!detail) {
      res.status(404).json({ message: 'Subclass not found' });
      return;
    }

    res.json(detail);
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

export const getBackgroundDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { backgroundName } = req.params;
    const detail = await dataService.getBackgroundDetail(backgroundName);
    if (!detail) {
      res.status(404).json({ message: 'Background not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getRaceDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceName } = req.params;
    const detail = await dataService.getRaceDetail(raceName);
    if (!detail) {
      res.status(404).json({ message: 'Race not found' });
      return;
    }

    res.json(detail);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getLanguages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const languages = await dataService.getLanguages();
    res.json(languages);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};
