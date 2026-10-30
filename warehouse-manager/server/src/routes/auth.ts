import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, pool } from '../database/db';
import { AuthenticatedRequest, requireAuth, generateToken, logAudit } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    const user = await queryOne<any>(
      'SELECT id, username, email, full_name, role, password_hash, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ message: 'Account is deactivated' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
    }

    const token = generateToken(user);
    const userPayload = {
      id: String(user.id),
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at || new Date().toISOString(),
    };

    await logAudit(user.id, 'LOGIN', 'user', user.id, { username: user.username }, req.ip || '');

    res.json({
      message: 'Login successful',
      token,
      user: userPayload,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: 'Failed to logout' });
        return;
      }
      res.json({ message: 'Logout successful' });
    });
  } else {
    res.json({ message: 'Logout successful' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  res.json({
    id: String(req.user.id),
    username: req.user.username,
    email: req.user.email,
    fullName: req.user.full_name,
    role: req.user.role,
    createdAt: (req.user as any).created_at || new Date().toISOString(),
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required' });
      return;
    }

    const user = await queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [req.user!.id]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user!.id]);
    await logAudit(req.user!.id, 'PASSWORD_CHANGE', 'user', req.user!.id, null, req.ip || '');

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/profile
 */
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
      res.status(400).json({ message: 'Full name and email are required' });
      return;
    }

    await pool.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [fullName, email, req.user!.id]);
    const updated = await queryOne<any>('SELECT id, username, email, full_name, role FROM users WHERE id = ?', [req.user!.id]);

    res.json({
      id: String(updated.id),
      username: updated.username,
      email: updated.email,
      fullName: updated.full_name,
      role: updated.role,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
