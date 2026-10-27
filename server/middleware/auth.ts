import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'student-spendsense-secure-jwt-secret-key-2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: { id: string; email: string; full_name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.'
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const user = db.findUserById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid session or user no longer exists.'
      });
      return;
    }

    const profile = db.getProfile(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      full_name: profile ? profile.full_name : decoded.full_name
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please log in again.'
    });
  }
}
