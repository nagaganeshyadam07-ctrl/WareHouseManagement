import { Router, Response } from 'express';
import { pool, query, queryOne, withTransaction } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/inventory
 * List stock with filters: warehouseId, category, status (in_stock, low_stock, out_of_stock), search
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['id', 'sku', 'product_name', 'quantity_on_hand', 'warehouse_name'], 'sku');
    const { search, warehouseId, warehouse_id, category, status } = req.query;

    let where = 'p.is_active = 1';
    const params: any[] = [];

    const wh = warehouseId || warehouse_id;
    if (wh) {
      where += ' AND i.warehouse_id = ?';
      params.push(parseInt(wh as string, 10));
    }
    if (category) {
      where += ' AND (c.name = ? OR c.id = ?)';
      params.push(category, category);
    }
    if (search) {
      where += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR sl.label LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (status === 'out_of_stock') {
      where += ' AND i.quantity_on_hand = 0';
    } else if (status === 'low_stock') {
      where += ' AND i.quantity_on_hand > 0 AND i.quantity_on_hand <= i.reorder_threshold';
    } else if (status === 'in_stock') {
      where += ' AND i.quantity_on_hand > i.reorder_threshold';
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       LEFT JOIN storage_locations sl ON i.location_id = sl.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    let sortCol = 'p.sku';
    if (sort.sortBy === 'product_name') sortCol = 'p.name';
    else if (sort.sortBy === 'quantity_on_hand') sortCol = 'i.quantity_on_hand';
    else if (sort.sortBy === 'warehouse_name') sortCol = 'w.name';
    else if (sort.sortBy === 'id') sortCol = 'i.id';

    const sql = `
      SELECT i.id, i.product_id, i.warehouse_id, i.location_id,
             i.quantity_on_hand, i.reserved_quantity, i.reorder_threshold,
             i.last_counted_at, i.updated_at,
             p.sku, p.name as product_name, p.unit_of_measure, p.unit_cost,
             c.name as category_name,
             w.name as warehouse_name, w.code as warehouse_code,
             sl.label as location_code
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN storage_locations sl ON i.location_id = sl.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where}
      ORDER BY ${sortCol} ${sort.sortOrder}
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const items = rows.map((r) => {
      const onHand = Number(r.quantity_on_hand);
      const reserved = Number(r.reserved_quantity);
      const threshold = Number(r.reorder_threshold);
      const available = Math.max(0, onHand - reserved);

      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (onHand === 0) stockStatus = 'out_of_stock';
      else if (onHand <= threshold) stockStatus = 'low_stock';

      return {
        id: String(r.id),
        productId: String(r.product_id),
        productName: r.product_name,
        sku: r.sku,
        category: r.category_name || 'Uncategorized',
        warehouseId: String(r.warehouse_id),
        warehouseName: r.warehouse_name,
        locationCode: r.location_code || 'Unassigned',
        locationId: r.location_id ? String(r.location_id) : undefined,
        onHand,
        reserved,
        available,
        reorderThreshold: threshold,
        unitCost: Number(r.unit_cost || 0),
        status: stockStatus,
        lastUpdated: r.updated_at || r.last_counted_at || new Date().toISOString(),
      };
    });

    res.json(paginatedResponse(items, total, pagination));
  } catch (err: any) {
    console.error('Get inventory error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/product/:productId
 */
router.get('/product/:productId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<any[]>(
      `SELECT i.*, p.sku, p.name as product_name, c.name as category_name,
              w.name as warehouse_name, sl.label as location_code
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       LEFT JOIN storage_locations sl ON i.location_id = sl.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE i.product_id = ?
       ORDER BY w.name ASC`,
      [req.params.productId]
    );

    const items = rows.map((r) => {
      const onHand = Number(r.quantity_on_hand);
      const reserved = Number(r.reserved_quantity);
      const available = Math.max(0, onHand - reserved);
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (onHand === 0) stockStatus = 'out_of_stock';
      else if (onHand <= Number(r.reorder_threshold)) stockStatus = 'low_stock';

      return {
        id: String(r.id),
        productId: String(r.product_id),
        productName: r.product_name,
        sku: r.sku,
        category: r.category_name || 'Uncategorized',
        warehouseId: String(r.warehouse_id),
        warehouseName: r.warehouse_name,
        locationCode: r.location_code || 'Unassigned',
        onHand,
        reserved,
        available,
        status: stockStatus,
        lastUpdated: r.updated_at || new Date().toISOString(),
      };
    });

    res.json(items);
  } catch (err: any) {
    console.error('Get product inventory error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/inventory/adjust
 * Stock adjustment with MySQL transaction & row locking
 */
router.post('/adjust', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, warehouseId, quantity, reason, notes, adjustmentType } = req.body;

    if (!productId || !warehouseId || quantity === undefined) {
      res.status(400).json({ message: 'Product, Warehouse, and Quantity are required' });
      return;
    }

    const prodId = parseInt(productId, 10);
    const whId = parseInt(warehouseId, 10);
    const qtyChange = parseInt(quantity, 10);

    if (isNaN(qtyChange)) {
      res.status(400).json({ message: 'Quantity must be a valid number' });
      return;
    }

    await withTransaction(async (conn) => {
      // Lock the inventory row
      const [rows] = await conn.query(
        'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
        [prodId, whId]
      ) as any[];

      let invRow = rows[0];
      let locId: number | null = null;

      if (!invRow) {
        // If not exists, find a location in that warehouse
        const [locations] = await conn.query(
          'SELECT id FROM storage_locations WHERE warehouse_id = ? AND is_active = 1 LIMIT 1',
          [whId]
        ) as any[];
        locId = locations[0]?.id || null;

        const initialQty = Math.max(0, qtyChange);
        const [insertRes] = await conn.query(
          'INSERT INTO inventory (product_id, warehouse_id, location_id, quantity_on_hand, reserved_quantity, reorder_threshold) VALUES (?, ?, ?, ?, 0, 10)',
          [prodId, whId, locId, initialQty]
        ) as any;

        const [created] = await conn.query('SELECT * FROM inventory WHERE id = ?', [insertRes.insertId]) as any[];
        invRow = created[0];
      } else {
        locId = invRow.location_id;
      }

      const beforeQty = Number(invRow.quantity_on_hand);
      const newQty = beforeQty + qtyChange;

      if (newQty < 0) {
        throw new Error(`Insufficient stock. Current on hand: ${beforeQty}, adjustment: ${qtyChange}`);
      }

      if (newQty < Number(invRow.reserved_quantity)) {
        throw new Error(`Cannot reduce on hand below reserved quantity (${invRow.reserved_quantity})`);
      }

      // Update inventory on hand
      await conn.query(
        'UPDATE inventory SET quantity_on_hand = ?, last_counted_at = NOW() WHERE id = ?',
        [newQty, invRow.id]
      );

      // Record adjustment
      const adjType = adjustmentType || (qtyChange > 0 ? 'found' : 'loss');
      await conn.query(
        'INSERT INTO stock_adjustments (product_id, warehouse_id, location_id, adjustment_type, quantity_before, quantity_after, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [prodId, whId, locId, adjType, beforeQty, newQty, reason || notes || 'Manual adjustment', req.user!.id]
      );

      // Record movement audit
      await conn.query(
        'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, "adjust", ?, "stock_adjustment", ?, ?, ?)',
        [prodId, whId, locId, Math.abs(qtyChange), invRow.id, `${reason || 'Stock adjustment'}: ${notes || ''}`, req.user!.id]
      );

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "STOCK_ADJUSTMENT", "inventory", ?, ?, ?)',
        [req.user!.id, invRow.id, JSON.stringify({ prodId, whId, before: beforeQty, after: newQty, delta: qtyChange, reason }), req.ip || '']
      );
    });

    res.json({ message: 'Stock adjustment applied successfully' });
  } catch (err: any) {
    console.error('Adjust stock error:', err);
    res.status(400).json({ message: err.message || 'Failed to adjust stock' });
  }
});

/**
 * POST /api/inventory/transfer
 * Inter-warehouse or inter-location stock transfer in a transaction
 */
router.post('/transfer', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      res.status(400).json({ message: 'Product, Source Warehouse, Target Warehouse, and Quantity are required' });
      return;
    }

    const prodId = parseInt(productId, 10);
    const fromWh = parseInt(fromWarehouseId, 10);
    const toWh = parseInt(toWarehouseId, 10);
    const transferQty = parseInt(quantity, 10);

    if (transferQty <= 0) {
      res.status(400).json({ message: 'Transfer quantity must be greater than zero' });
      return;
    }

    if (fromWh === toWh) {
      res.status(400).json({ message: 'Source and destination warehouses must be different' });
      return;
    }

    await withTransaction(async (conn) => {
      // Lock source inventory
      const [srcRows] = await conn.query(
        'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
        [prodId, fromWh]
      ) as any[];

      const srcInv = srcRows[0];
      if (!srcInv) {
        throw new Error('Product does not exist in the source warehouse');
      }

      const available = Number(srcInv.quantity_on_hand) - Number(srcInv.reserved_quantity);
      if (available < transferQty) {
        throw new Error(`Insufficient available stock at source. Available: ${available}, requested: ${transferQty}`);
      }

      // Lock destination inventory
      const [destRows] = await conn.query(
        'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
        [prodId, toWh]
      ) as any[];

      let destInv = destRows[0];
      if (!destInv) {
        const [destLocs] = await conn.query(
          'SELECT id FROM storage_locations WHERE warehouse_id = ? AND is_active = 1 LIMIT 1',
          [toWh]
        ) as any[];
        const destLocId = destLocs[0]?.id || null;

        const [insertRes] = await conn.query(
          'INSERT INTO inventory (product_id, warehouse_id, location_id, quantity_on_hand, reserved_quantity, reorder_threshold) VALUES (?, ?, ?, 0, 0, 10)',
          [prodId, toWh, destLocId]
        ) as any;
        const [created] = await conn.query('SELECT * FROM inventory WHERE id = ?', [insertRes.insertId]) as any[];
        destInv = created[0];
      }

      // Decrement source
      await conn.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?',
        [transferQty, srcInv.id]
      );

      // Increment target
      await conn.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?',
        [transferQty, destInv.id]
      );

      // Record transfer record
      const [transRes] = await conn.query(
        'INSERT INTO inventory_transfers (product_id, from_warehouse_id, from_location_id, to_warehouse_id, to_location_id, quantity, status, notes, performed_by, completed_at) VALUES (?, ?, ?, ?, ?, ?, "completed", ?, ?, NOW())',
        [prodId, fromWh, srcInv.location_id, toWh, destInv.location_id, transferQty, notes || null, req.user!.id]
      ) as any;

      // Movements
      await conn.query(
        'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, "transfer_out", ?, "transfer", ?, ?, ?)',
        [prodId, fromWh, srcInv.location_id, transferQty, transRes.insertId, `Transfer to warehouse #${toWh}`, req.user!.id]
      );

      await conn.query(
        'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, "transfer_in", ?, "transfer", ?, ?, ?)',
        [prodId, toWh, destInv.location_id, transferQty, transRes.insertId, `Transfer from warehouse #${fromWh}`, req.user!.id]
      );

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "STOCK_TRANSFER", "inventory", ?, ?, ?)',
        [req.user!.id, transRes.insertId, JSON.stringify({ prodId, fromWh, toWh, transferQty, notes }), req.ip || '']
      );
    });

    res.json({ message: 'Stock transferred successfully' });
  } catch (err: any) {
    console.error('Transfer stock error:', err);
    res.status(400).json({ message: err.message || 'Failed to transfer stock' });
  }
});

/**
 * GET /api/inventory/movements
 */
router.get('/movements', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { productId, warehouseId, type } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (productId) {
      where += ' AND m.product_id = ?';
      params.push(parseInt(productId as string, 10));
    }
    if (warehouseId) {
      where += ' AND m.warehouse_id = ?';
      params.push(parseInt(warehouseId as string, 10));
    }
    if (type) {
      where += ' AND m.movement_type = ?';
      params.push(type);
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total FROM inventory_movements m WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT m.*, p.name as product_name, p.sku,
             w.name as warehouse_name, u.full_name as performed_by_name
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      JOIN warehouses w ON m.warehouse_id = w.id
      LEFT JOIN users u ON m.performed_by = u.id
      WHERE ${where}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const movements = rows.map((r) => ({
      id: String(r.id),
      productId: String(r.product_id),
      productName: r.product_name,
      sku: r.sku,
      warehouseId: String(r.warehouse_id),
      warehouseName: r.warehouse_name,
      type: r.movement_type === 'receive' ? 'receipt' : r.movement_type === 'ship' ? 'shipment' : r.movement_type,
      quantity: Number(r.quantity),
      reference: r.reference_type ? `${r.reference_type} #${r.reference_id || ''}` : 'Manual',
      performedBy: r.performed_by_name || 'System',
      notes: r.reason || '',
      createdAt: r.created_at,
    }));

    res.json(paginatedResponse(movements, total, pagination));
  } catch (err: any) {
    console.error('Get movements error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/export
 */
router.get('/export', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<any[]>(
      `SELECT p.sku, p.name, c.name as category, w.name as warehouse,
              sl.label as location, i.quantity_on_hand, i.reserved_quantity,
              p.unit_cost, (i.quantity_on_hand * p.unit_cost) as total_value
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       LEFT JOIN storage_locations sl ON i.location_id = sl.id
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.sku ASC`
    );

    const headers = ['SKU', 'Product Name', 'Category', 'Warehouse', 'Location', 'On Hand', 'Reserved', 'Unit Cost', 'Total Value'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push([
        `"${r.sku}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${r.category || ''}"`,
        `"${r.warehouse || ''}"`,
        `"${r.location || ''}"`,
        r.quantity_on_hand,
        r.reserved_quantity,
        r.unit_cost,
        Number(r.total_value || 0).toFixed(2),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
    res.send(csvLines.join('\n'));
  } catch (err: any) {
    console.error('Export inventory error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
