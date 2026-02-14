import { Request, Response } from 'express';
import { supabase } from '../config/database.js';
import { User, CreateUserInput, toUserResponse } from '../models/User.js';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    const users = (data as User[]).map(toUserResponse);
    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: CreateUserInput = {
      name: req.body.name?.trim(),
      email: req.body.email?.toLowerCase().trim()
    };

    if (!input.name || !input.email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(toUserResponse(data as User));
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Unknown error occurred' });
    }
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      throw error;
    }

    res.json(toUserResponse(data as User));
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error occurred' });
    }
  }
};
