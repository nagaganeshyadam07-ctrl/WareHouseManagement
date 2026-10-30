import { Router, Response } from 'express';
import { pool, query, queryOne, withTransaction } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/receipts
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { status, warehouseId, search } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND r.status = ?';
      params.push(status);
    }
    if (warehouseId) {
      where += ' AND r.warehouse_id = ?';
      params.push(parseInt(warehouseId as string, 10));
    }
    if (search) {
      where += ' AND (r.receipt_number LIKE ? OR s.name LIKE ?)';
      const sVal = `%${search}%`;
      params.push(sVal, sVal);
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total
       FROM inbound_receipts r
       LEFT JOIN suppliers s ON r.supplier_id = s.id
       WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT r.*, s.name as supplier_name, w.name as warehouse_name,
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM receipt_items ri WHERE ri.receipt_id = r.id) as items_count
      FROM inbound_receipts r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      JOIN warehouses w ON r.warehouse_id = w.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const receipts = rows.map((r) => ({
      id: String(r.id),
      receiptNumber: r.receipt_number,
      supplierId: r.supplier_id ? String(r.supplier_id) : '',
      supplierName: r.supplier_name || 'Direct / Unknown',
      warehouseId: String(r.warehouse_id),
      warehouseName: r.warehouse_name,
      status: r.status,
      expectedDate: r.expected_date,
      receivedDate: r.received_date,
      itemsCount: Number(r.items_count || 0),
      notes: r.notes || '',
      createdBy: r.created_by_name || 'System',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(paginatedResponse(receipts, total, pagination));
  } catch (err: any) {
    console.error('Get receipts error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/receipts/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receipt = await queryOne<any>(
      `SELECT r.*, s.name as supplier_name, w.name as warehouse_name,
              u.full_name as created_by_name
       FROM inbound_receipts r
       LEFT JOIN suppliers s ON r.supplier_id = s.id
       JOIN warehouses w ON r.warehouse_id = w.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!receipt) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }

    const items = await query<any[]>(
      `SELECT ri.*, p.name as product_name, p.sku, sl.label as location_code
       FROM receipt_items ri
       JOIN products p ON ri.product_id = p.id
       LEFT JOIN storage_locations sl ON ri.location_id = sl.id
       WHERE ri.receipt_id = ?`,
      [req.params.id]
    );

    res.json({
      id: String(receipt.id),
      receiptNumber: receipt.receipt_number,
      supplierId: receipt.supplier_id ? String(receipt.supplier_id) : '',
      supplierName: receipt.supplier_name || 'Direct Supplier',
      warehouseId: String(receipt.warehouse_id),
      warehouseName: receipt.warehouse_name,
      status: receipt.status,
      expectedDate: receipt.expected_date,
      receivedDate: receipt.received_date,
      notes: receipt.notes,
      itemsCount: items.length,
      createdBy: receipt.created_by_name || 'System',
      items: items.map((item) => ({
        id: String(item.id),
        receiptId: String(item.receipt_id),
        productId: String(item.product_id),
        productName: item.product_name,
        sku: item.sku,
        expectedQuantity: Number(item.expected_quantity),
        receivedQuantity: Number(item.received_quantity),
        locationCode: item.location_code || 'Receiving Bay',
        notes: item.notes,
      })),
      createdAt: receipt.created_at,
      updatedAt: receipt.updated_at,
    });
  } catch (err: any) {
    console.error('Get receipt details error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/receipts
 */
router.post('/', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId, warehouseId, expectedDate, notes, items } = req.body;

    if (!warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Warehouse and at least one item are required' });
      return;
    }

    const receiptNum = `REC-${Date.now().toString().slice(-6)}`;

    let receiptId = 0;
    await withTransaction(async (conn) => {
      const [resIns] = await conn.query(
        'INSERT INTO inbound_receipts (receipt_number, supplier_id, warehouse_id, status, expected_date, notes, created_by) VALUES (?, ?, ?, "draft", ?, ?, ?)',
        [receiptNum, supplierId ? parseInt(supplierId, 10) : null, parseInt(warehouseId, 10), expectedDate || null, notes || null, req.user!.id]
      ) as any;
      receiptId = resIns.insertId;

      for (const item of items) {
        await conn.query(
          'INSERT INTO receipt_items (receipt_id, product_id, expected_quantity, received_quantity) VALUES (?, ?, ?, 0)',
          [receiptId, parseInt(item.productId, 10), parseInt(item.expectedQuantity, 10) || 0]
        );
      }

      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "CREATE_RECEIPT", "receipt", ?, ?, ?)',
        [req.user!.id, receiptId, JSON.stringify({ receiptNum, itemsCount: items.length }), req.ip || '']
      );
    });

    res.status(201).json({ id: String(receiptId), receiptNumber: receiptNum, status: 'draft' });
  } catch (err: any) {
    console.error('Create receipt error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /api/receipts/:receiptId/items/:itemId
 * Update received count for an item
 */
router.patch('/:receiptId/items/:itemId', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { receivedQuantity, notes, locationId } = req.body;
    const { receiptId, itemId } = req.params;

    const receipt = await queryOne<any>('SELECT status FROM inbound_receipts WHERE id = ?', [receiptId]);
    if (!receipt) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }
    if (receipt.status === 'completed' || receipt.status === 'cancelled') {
      res.status(400).json({ message: `Cannot modify item on a ${receipt.status} receipt` });
      return;
    }

    await pool.query(
      `UPDATE receipt_items SET
         received_quantity = COALESCE(?, received_quantity),
         location_id = COALESCE(?, location_id),
         notes = COALESCE(?, notes)
       WHERE id = ? AND receipt_id = ?`,
      [
        receivedQuantity !== undefined ? parseInt(receivedQuantity, 10) : null,
        locationId ? parseInt(locationId, 10) : null,
        notes,
        itemId,
        receiptId,
      ]
    );

    // If receipt was draft and we received items, move to in_progress
    if (receipt.status === 'draft' && receivedQuantity > 0) {
      await pool.query('UPDATE inbound_receipts SET status = "in_progress" WHERE id = ?', [receiptId]);
    }

    const updated = await queryOne<any>('SELECT * FROM receipt_items WHERE id = ?', [itemId]);
    res.json(updated);
  } catch (err: any) {
    console.error('Update receipt item error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/receipts/:id/complete
 * Receive workflow completion: Atomically credits warehouse stock in MySQL transaction
 */
router.post('/:id/complete', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receiptId = parseInt(req.params.id, 10);

    await withTransaction(async (conn) => {
      const [receiptRows] = await conn.query(
        'SELECT * FROM inbound_receipts WHERE id = ? FOR UPDATE',
        [receiptId]
      ) as any[];

      const receipt = receiptRows[0];
      if (!receipt) {
        throw new Error('Receipt not found');
      }

      if (receipt.status === 'completed') {
        throw new Error('Receipt is already completed');
      }
      if (receipt.status === 'cancelled') {
        throw new Error('Receipt has been cancelled and cannot be completed');
      }

      const [items] = await conn.query(
        'SELECT * FROM receipt_items WHERE receipt_id = ?',
        [receiptId]
      ) as any[];

      if (items.length === 0) {
        throw new Error('Receipt has no items');
      }

      // Check default location for this warehouse
      const [whLocs] = await conn.query(
        'SELECT id FROM storage_locations WHERE warehouse_id = ? AND is_active = 1 LIMIT 1',
        [receipt.warehouse_id]
      ) as any[];
      const defaultLocId = whLocs[0]?.id || null;

      for (const item of items) {
        // Use received_quantity if recorded, else expected_quantity
        const qtyToCredit = item.received_quantity > 0 ? item.received_quantity : item.expected_quantity;
        const targetLocId = item.location_id || defaultLocId;

        if (qtyToCredit > 0) {
          // Lock inventory row if exists
          const [invRows] = await conn.query(
            'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
            [item.product_id, receipt.warehouse_id]
          ) as any[];

          if (invRows.length > 0) {
            await conn.query(
              'UPDATE inventory SET quantity_on_hand = quantity_on_hand + ?, last_counted_at = NOW() WHERE id = ?',
              [qtyToCredit, invRows[0].id]
            );
          } else {
            await conn.query(
              'INSERT INTO inventory (product_id, warehouse_id, location_id, quantity_on_hand, reserved_quantity, reorder_threshold, last_counted_at) VALUES (?, ?, ?, ?, 0, 10, NOW())',
              [item.product_id, receipt.warehouse_id, targetLocId, qtyToCredit]
            );
          }

          // Update item received_quantity if it was 0
          if (item.received_quantity === 0) {
            await conn.query(
              'UPDATE receipt_items SET received_quantity = ? WHERE id = ?',
              [qtyToCredit, item.id]
            );
          }

          // Record movement
          await conn.query(
            'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, "receive", ?, "inbound_receipt", ?, ?, ?)',
            [item.product_id, receipt.warehouse_id, targetLocId, qtyToCredit, receipt.id, `Inbound receipt ${receipt.receipt_number}`, req.user!.id]
          );
        }
      }

      // Update receipt status
      await conn.query(
        'UPDATE inbound_receipts SET status = "completed", received_date = CURRENT_DATE() WHERE id = ?',
        [receiptId]
      );

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "RECEIPT_COMPLETE", "receipt", ?, ?, ?)',
        [req.user!.id, receiptId, JSON.stringify({ receiptNum: receipt.receipt_number, itemsCount: items.length }), req.ip || '']
      );
    });

    const updated = await queryOne<any>('SELECT * FROM inbound_receipts WHERE id = ?', [receiptId]);
    res.json({
      id: String(updated.id),
      receiptNumber: updated.receipt_number,
      status: updated.status,
      receivedDate: updated.received_date,
    });
  } catch (err: any) {
    console.error('Complete receipt error:', err);
    res.status(400).json({ message: err.message || 'Failed to complete receipt' });
  }
});

/**
 * POST /api/receipts/:id/cancel
 */
router.post('/:id/cancel', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const receiptId = parseInt(req.params.id, 10);
    const receipt = await queryOne<any>('SELECT status FROM inbound_receipts WHERE id = ?', [receiptId]);

    if (!receipt) {
      res.status(404).json({ message: 'Receipt not found' });
      return;
    }
    if (receipt.status === 'completed') {
      res.status(400).json({ message: 'Cannot cancel a completed receipt' });
      return;
    }

    await pool.query('UPDATE inbound_receipts SET status = "cancelled" WHERE id = ?', [receiptId]);
    await logAudit(req.user!.id, 'CANCEL_RECEIPT', 'receipt', receiptId, null, req.ip || '');

    res.json({ message: 'Receipt cancelled successfully' });
  } catch (err: any) {
    console.error('Cancel receipt error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
