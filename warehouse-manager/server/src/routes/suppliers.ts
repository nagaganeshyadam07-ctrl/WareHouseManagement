import { Router, Response } from 'express';
import { pool, query, queryOne } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/suppliers
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { search, status } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (s.name LIKE ? OR s.code LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)';
      const sVal = `%${search}%`;
      params.push(sVal, sVal, sVal, sVal);
    }
    if (status === 'active') {
      where += ' AND s.is_active = 1';
    } else if (status === 'inactive') {
      where += ' AND s.is_active = 0';
    }

    const countRes = await query<any[]>(`SELECT COUNT(*) as total FROM suppliers s WHERE ${where}`, params);
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT s.*,
         (SELECT COUNT(*) FROM inbound_receipts r WHERE r.supplier_id = s.id) as receipts_count
      FROM suppliers s
      WHERE ${where}
      ORDER BY s.name ASC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const suppliers = rows.map((s) => ({
      id: String(s.id),
      name: s.name,
      code: s.code,
      contactName: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      country: s.country || '',
      status: s.is_active ? 'active' : 'inactive',
      productsCount: Number(s.receipts_count || 0),
      createdAt: s.created_at,
    }));

    res.json(paginatedResponse(suppliers, total, pagination));
  } catch (err: any) {
    console.error('Get suppliers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/suppliers/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const s = await queryOne<any>('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!s) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    res.json({
      id: String(s.id),
      name: s.name,
      code: s.code,
      contactName: s.contact_person,
      email: s.email,
      phone: s.phone,
      address: s.address,
      city: s.city,
      state: s.state,
      country: s.country,
      status: s.is_active ? 'active' : 'inactive',
      createdAt: s.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/suppliers
 */
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, contactName, email, phone, address, city, state, country } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'Supplier name and code are required' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, state, country, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [name, code, contactName || null, email || null, phone || null, address || null, city || null, state || null, country || 'USA']
    ) as any;

    await logAudit(req.user!.id, 'CREATE_SUPPLIER', 'supplier', result.insertId, { name, code }, req.ip || '');

    res.status(201).json({
      id: String(result.insertId),
      name,
      code,
      contactName,
      email,
      phone,
      status: 'active',
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Supplier code already exists' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
