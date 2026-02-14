import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { supabase } from '../config/database.js';
import { UserResponse } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export const validateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  const result = await checkApiKey(apiKey);

  if (!result.valid) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  req.user = result.user;
  next();
};

export const checkApiKey = async (apiKey: string): Promise<{ valid: boolean; user?: UserResponse }> => {
  const hash = hashKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, users(id, name, email, created_at)')
    .eq('key_hash', hash)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Update last_used_at in the background (don't await)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then();

  const user = data.users as unknown as { id: string; name: string; email: string; created_at: string };

  return {
    valid: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    },
  };
};
