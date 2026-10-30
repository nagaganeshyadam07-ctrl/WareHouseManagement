import { Router, Response } from 'express';
import { pool, query, queryOne } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';

const router = Router();

/**
 * GET /api/warehouses
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, is_active } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (w.name LIKE ? OR w.code LIKE ? OR w.city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (is_active !== undefined) {
      where += ' AND w.is_active = ?';
      params.push(parseInt(is_active as string, 10));
    }

    const warehouses = await query<any[]>(
      `SELECT w.*,
         (SELECT COUNT(*) FROM storage_locations sl WHERE sl.warehouse_id = w.id AND sl.is_active = 1) as locationsCount,
         (SELECT COALESCE(SUM(i.quantity_on_hand), 0) FROM inventory i WHERE i.warehouse_id = w.id) as totalStock,
         (SELECT COUNT(DISTINCT i.product_id) FROM inventory i WHERE i.warehouse_id = w.id AND i.quantity_on_hand > 0) as uniqueProducts
       FROM warehouses w
       WHERE ${where}
       ORDER BY w.name ASC`,
      params
    );

    const formatted = warehouses.map((w) => ({
      id: String(w.id),
      name: w.name,
      code: w.code,
      address: w.address,
      city: w.city,
      state: w.state,
      country: w.country,
      capacity: w.capacity || 10000,
      currentUtilization: Math.min(100, Math.round(((w.totalStock || 0) / (w.capacity || 10000)) * 100)),
      totalStock: Number(w.totalStock || 0),
      locationsCount: Number(w.locationsCount || 0),
      uniqueProducts: Number(w.uniqueProducts || 0),
      status: w.is_active ? 'active' : 'inactive',
      createdAt: w.created_at,
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Get warehouses error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/warehouses/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const warehouse = await queryOne<any>(
      `SELECT w.*,
         (SELECT COUNT(*) FROM storage_locations sl WHERE sl.warehouse_id = w.id AND sl.is_active = 1) as locationsCount,
         (SELECT COALESCE(SUM(i.quantity_on_hand), 0) FROM inventory i WHERE i.warehouse_id = w.id) as totalStock,
         (SELECT COUNT(DISTINCT i.product_id) FROM inventory i WHERE i.warehouse_id = w.id AND i.quantity_on_hand > 0) as uniqueProducts
       FROM warehouses w
       WHERE w.id = ?`,
      [id]
    );

    if (!warehouse) {
      res.status(404).json({ message: 'Warehouse not found' });
      return;
    }

    const locations = await query<any[]>(
      `SELECT sl.*,
         (SELECT COALESCE(SUM(i.quantity_on_hand), 0) FROM inventory i WHERE i.location_id = sl.id) as currentItems
       FROM storage_locations sl
       WHERE sl.warehouse_id = ? AND sl.is_active = 1
       ORDER BY sl.label ASC`,
      [id]
    );

    res.json({
      id: String(warehouse.id),
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      country: warehouse.country,
      capacity: warehouse.capacity,
      currentUtilization: Math.min(100, Math.round(((warehouse.totalStock || 0) / (warehouse.capacity || 10000)) * 100)),
      totalStock: Number(warehouse.totalStock || 0),
      locationsCount: Number(warehouse.locationsCount || 0),
      uniqueProducts: Number(warehouse.uniqueProducts || 0),
      status: warehouse.is_active ? 'active' : 'inactive',
      locations: locations.map((loc) => ({
        id: String(loc.id),
        warehouseId: String(loc.warehouse_id),
        label: loc.label,
        code: loc.label,
        zone: loc.zone,
        aisle: loc.aisle,
        rack: loc.rack,
        bin: loc.bin,
        currentItems: Number(loc.currentItems || 0),
        status: loc.is_active ? 'active' : 'inactive',
      })),
      createdAt: warehouse.created_at,
    });
  } catch (err: any) {
    console.error('Get warehouse error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/warehouses/:id/locations
 */
router.get('/:id/locations', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const locations = await query<any[]>(
      `SELECT sl.*,
         (SELECT COALESCE(SUM(i.quantity_on_hand), 0) FROM inventory i WHERE i.location_id = sl.id) as currentItems
       FROM storage_locations sl
       WHERE sl.warehouse_id = ? AND sl.is_active = 1
       ORDER BY sl.label ASC`,
      [id]
    );

    res.json(
      locations.map((loc) => ({
        id: String(loc.id),
        warehouseId: String(loc.warehouse_id),
        label: loc.label,
        code: loc.label,
        zone: loc.zone,
        aisle: loc.aisle,
        rack: loc.rack,
        bin: loc.bin,
        currentItems: Number(loc.currentItems || 0),
        status: loc.is_active ? 'active' : 'inactive',
      }))
    );
  } catch (err: any) {
    console.error('Get warehouse locations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/warehouses
 */
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, address, city, state, country, capacity } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'Warehouse name and code are required' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO warehouses (name, code, address, city, state, country, capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [name, code, address || null, city || null, state || null, country || 'USA', capacity ? parseInt(capacity, 10) : 10000]
    ) as any;

    await logAudit(req.user!.id, 'CREATE_WAREHOUSE', 'warehouse', result.insertId, { name, code }, req.ip || '');

    res.status(201).json({
      id: String(result.insertId),
      name,
      code,
      address,
      city,
      state,
      country,
      capacity: capacity || 10000,
      status: 'active',
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'A warehouse with this name or code already exists' });
      return;
    }
    console.error('Create warehouse error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
