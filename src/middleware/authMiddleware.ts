import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartpark-secret';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header.' });
    return;
  }

  const token = header.split(' ')[1]!;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { user_id: string; role: string };
    req.user = { user_id: payload.user_id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
};

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ user_id: userId, role }, JWT_SECRET, { expiresIn: '24h' });
};
