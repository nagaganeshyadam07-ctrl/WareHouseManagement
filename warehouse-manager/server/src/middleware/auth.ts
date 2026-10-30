import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne, pool } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_warehouse_jwt_key_2026_enterprise';

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
    role: string;
  }
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: { id: number; username: string; role: string; email: string; full_name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      fullName: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware that requires a valid session or JWT Bearer token with an active user.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let userId: number | null = null;

    // 1. Check Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (jwtErr) {
        // Token invalid or expired
      }
    }

    // 2. Check Express session if no token or token failed
    if (!userId && req.session && req.session.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await queryOne<AuthUser>(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (!user) {
      if (req.session) {
        req.session.destroy(() => {});
      }
      res.status(401).json({ message: 'User not found or deactivated' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    res.status(500).json({ message: 'Internal authentication error' });
  }
}

/**
 * Middleware factory that checks if the authenticated user has one of the allowed roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions', required: roles });
      return;
    }

    next();
  };
}

/**
 * Helper to get the current user from the request.
 */
export function getCurrentUser(req: AuthenticatedRequest): AuthUser | null {
  return req.user || null;
}

/**
 * Log an action to the audit log.
 */
export async function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details: Record<string, any> | null,
  ipAddress: string
): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress || '127.0.0.1']
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
