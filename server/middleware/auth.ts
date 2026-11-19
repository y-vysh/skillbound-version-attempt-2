import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/env.ts';
import { db } from '../db/database.ts';

export interface AuthUser {
  id: number;
  email: string;
  role: 'student' | 'admin';
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  userId: number;
  email: string;
  role: 'student' | 'admin';
}

export function signToken(user: { id: number; email: string; role: 'student' | 'admin' }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
    const dbUser = db
      .prepare('SELECT id, email, role, full_name, is_active FROM users WHERE id = ?')
      .get(decoded.userId) as
      | { id: number; email: string; role: 'student' | 'admin'; full_name: string; is_active: number }
      | undefined;

    if (!dbUser) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (!dbUser.is_active) {
      res.status(403).json({ error: 'Your account has been suspended. Contact an administrator.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      full_name: dbUser.full_name,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
    const dbUser = db
      .prepare('SELECT id, email, role, full_name, is_active FROM users WHERE id = ?')
      .get(decoded.userId) as
      | { id: number; email: string; role: 'student' | 'admin'; full_name: string; is_active: number }
      | undefined;

    if (dbUser && dbUser.is_active) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        full_name: dbUser.full_name,
      };
    }
  } catch {
    // ignore invalid optional token
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }
  next();
}
