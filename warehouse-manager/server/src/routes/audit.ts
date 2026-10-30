import { Router, Response } from 'express';
import { query } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';
import { parsePagination, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/audit
 */
router.get('/', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { action, entityType, search } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (action) {
      where += ' AND a.action = ?';
      params.push(action);
    }
    if (entityType) {
      where += ' AND a.entity_type = ?';
      params.push(entityType);
    }
    if (search) {
      where += ' AND (a.action LIKE ? OR a.entity_type LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total FROM audit_log a LEFT JOIN users u ON a.user_id = u.id WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT a.*, u.username, u.full_name as user_name
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const logs = rows.map((r) => {
      let detailsStr = '';
      if (typeof r.details === 'object' && r.details !== null) {
        detailsStr = JSON.stringify(r.details);
      } else {
        detailsStr = r.details || '';
      }

      return {
        id: String(r.id),
        userId: String(r.user_id || ''),
        userName: r.user_name || r.username || 'System',
        action: r.action,
        entityType: r.entity_type,
        entityId: String(r.entity_id || ''),
        details: detailsStr,
        ipAddress: r.ip_address || '',
        createdAt: r.created_at,
      };
    });

    res.json(paginatedResponse(logs, total, pagination));
  } catch (err: any) {
    console.error('Get audit log error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
