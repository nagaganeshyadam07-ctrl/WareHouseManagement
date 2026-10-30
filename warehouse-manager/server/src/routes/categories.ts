import { Router, Response } from 'express';
import { pool, query } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/categories
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<any[]>('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/categories
 */
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    ) as any;

    res.status(201).json({ id: result.insertId, name, description });
  } catch (err: any) {
    console.error('Create category error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
