import { Router, Response } from 'express';
import { pool, query, queryOne, withTransaction } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/shipments
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { status, warehouseId, search } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }
    if (warehouseId) {
      where += ' AND s.warehouse_id = ?';
      params.push(parseInt(warehouseId as string, 10));
    }
    if (search) {
      where += ' AND (s.shipment_number LIKE ? OR s.tracking_number LIKE ? OR s.recipient_name LIKE ? OR o.order_number LIKE ?)';
      const sVal = `%${search}%`;
      params.push(sVal, sVal, sVal, sVal);
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT s.*, o.order_number, w.name as warehouse_name,
             u.full_name as assigned_to_name,
             (SELECT COUNT(*) FROM shipment_items si WHERE si.shipment_id = s.id) as items_count
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.id
      JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN users u ON s.assigned_to = u.id
      WHERE ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const shipments = rows.map((r) => ({
      id: String(r.id),
      shipmentNumber: r.shipment_number,
      orderId: r.order_id ? String(r.order_id) : '',
      orderNumber: r.order_number || 'Direct Shipment',
      recipientName: r.recipient_name || '',
      recipientAddress: r.shipping_address || '',
      warehouseId: String(r.warehouse_id),
      warehouseName: r.warehouse_name,
      carrier: r.carrier || 'Pending Carrier',
      trackingNumber: r.tracking_number || '',
      status: r.status,
      shipDate: r.actual_ship_date || r.expected_ship_date,
      deliveryDate: r.actual_delivery_date || r.expected_delivery_date,
      itemsCount: Number(r.items_count || 0),
      notes: r.notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(paginatedResponse(shipments, total, pagination));
  } catch (err: any) {
    console.error('Get shipments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/shipments/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipment = await queryOne<any>(
      `SELECT s.*, o.order_number, w.name as warehouse_name
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    const items = await query<any[]>(
      `SELECT si.*, p.name as product_name, p.sku, sl.label as location_code
       FROM shipment_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN storage_locations sl ON si.location_id = sl.id
       WHERE si.shipment_id = ?`,
      [req.params.id]
    );

    const events = await query<any[]>(
      `SELECT e.*, u.full_name as user_name
       FROM shipment_status_events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.shipment_id = ?
       ORDER BY e.created_at ASC`,
      [req.params.id]
    );

    res.json({
      id: String(shipment.id),
      shipmentNumber: shipment.shipment_number,
      orderId: shipment.order_id ? String(shipment.order_id) : '',
      orderNumber: shipment.order_number || 'Direct Shipment',
      recipientName: shipment.recipient_name || '',
      recipientAddress: shipment.shipping_address || '',
      warehouseId: String(shipment.warehouse_id),
      warehouseName: shipment.warehouse_name,
      carrier: shipment.carrier || '',
      trackingNumber: shipment.tracking_number || '',
      status: shipment.status,
      shipDate: shipment.actual_ship_date || shipment.expected_ship_date,
      deliveryDate: shipment.actual_delivery_date || shipment.expected_delivery_date,
      itemsCount: items.length,
      notes: shipment.notes || '',
      items: items.map((i) => ({
        id: String(i.id),
        shipmentId: String(i.shipment_id),
        productId: String(i.product_id),
        productName: i.product_name,
        sku: i.sku,
        quantityOrdered: Number(i.quantity_ordered),
        quantityPicked: Number(i.quantity_picked),
        quantityPacked: Number(i.quantity_packed),
        locationCode: i.location_code || 'Picking Aisle',
      })),
      timeline: events.map((e) => ({
        id: String(e.id),
        status: e.status,
        notes: e.notes,
        userName: e.user_name || 'System',
        createdAt: e.created_at,
      })),
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at,
    });
  } catch (err: any) {
    console.error('Get shipment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shipments
 */
router.post('/', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, warehouseId, carrier, notes, items } = req.body;

    if (!warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Warehouse and items are required' });
      return;
    }

    const shipmentNum = `SHP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    let recipientName = 'Customer';
    let shippingAddress = 'Main Delivery Address';

    if (orderId) {
      const order = await queryOne<any>('SELECT customer_name, shipping_address FROM orders WHERE id = ?', [orderId]);
      if (order) {
        recipientName = order.customer_name;
        shippingAddress = order.shipping_address;
      }
    }

    let shipmentId = 0;
    await withTransaction(async (conn) => {
      const [resIns] = await conn.query(
        'INSERT INTO shipments (shipment_number, order_id, warehouse_id, status, recipient_name, shipping_address, carrier, notes, created_by) VALUES (?, ?, ?, "ready_to_pick", ?, ?, ?, ?, ?)',
        [shipmentNum, orderId ? parseInt(orderId, 10) : null, parseInt(warehouseId, 10), recipientName, shippingAddress, carrier || 'Standard Ground', notes || null, req.user!.id]
      ) as any;
      shipmentId = resIns.insertId;

      // Find location for items
      const [whLocs] = await conn.query(
        'SELECT id FROM storage_locations WHERE warehouse_id = ? AND is_active = 1 LIMIT 1',
        [parseInt(warehouseId, 10)]
      ) as any[];
      const defaultLocId = whLocs[0]?.id || null;

      for (const item of items) {
        await conn.query(
          'INSERT INTO shipment_items (shipment_id, product_id, quantity_ordered, quantity_picked, quantity_packed, location_id) VALUES (?, ?, ?, 0, 0, ?)',
          [shipmentId, parseInt(item.productId, 10), parseInt(item.quantity, 10), defaultLocId]
        );
      }

      await conn.query(
        'INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "ready_to_pick", "Shipment created and ready to pick", ?)',
        [shipmentId, req.user!.id]
      );

      // Update linked order status to processing
      if (orderId) {
        await conn.query('UPDATE orders SET status = "processing" WHERE id = ?', [orderId]);
      }

      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "CREATE_SHIPMENT", "shipment", ?, ?, ?)',
        [req.user!.id, shipmentId, JSON.stringify({ shipmentNum, orderId }), req.ip || '']
      );
    });

    res.status(201).json({ id: String(shipmentId), shipmentNumber: shipmentNum, status: 'ready_to_pick' });
  } catch (err: any) {
    console.error('Create shipment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shipments/:id/ready-to-pick
 */
router.post('/:id/ready-to-pick', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    await pool.query('UPDATE shipments SET status = "ready_to_pick" WHERE id = ?', [shipmentId]);
    await pool.query('INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "ready_to_pick", "Marked ready to pick", ?)', [shipmentId, req.user!.id]);
    res.json({ message: 'Shipment marked ready to pick' });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shipments/:id/start-picking
 */
router.post('/:id/start-picking', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    await pool.query('UPDATE shipments SET status = "picking", assigned_to = ? WHERE id = ?', [req.user!.id, shipmentId]);
    await pool.query('INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "picking", "Picking in progress", ?)', [shipmentId, req.user!.id]);
    res.json({ message: 'Picking started' });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shipments/:id/confirm-packed
 */
router.post('/:id/confirm-packed', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    const { items } = req.body;

    await withTransaction(async (conn) => {
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const pickedQty = parseInt(item.pickedQuantity, 10) || 0;
          await conn.query(
            'UPDATE shipment_items SET quantity_picked = ?, quantity_packed = ? WHERE id = ? AND shipment_id = ?',
            [pickedQty, pickedQty, item.itemId, shipmentId]
          );
        }
      } else {
        // Mark all items as fully picked and packed
        await conn.query(
          'UPDATE shipment_items SET quantity_picked = quantity_ordered, quantity_packed = quantity_ordered WHERE shipment_id = ?',
          [shipmentId]
        );
      }

      await conn.query('UPDATE shipments SET status = "packed" WHERE id = ?', [shipmentId]);
      await conn.query(
        'INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "packed", "All items packed and verified", ?)',
        [shipmentId, req.user!.id]
      );
    });

    res.json({ message: 'Shipment confirmed packed' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to pack shipment' });
  }
});

/**
 * POST /api/shipments/:id/dispatch
 * DISPATCH WORKFLOW:
 * Concurrency protected with MySQL transaction & row lock (FOR UPDATE).
 * Prevents duplicate dispatches and duplicate inventory deductions.
 * Deducts stock from inventory and records audit movement.
 */
router.post('/:id/dispatch', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    const { trackingNumber } = req.body;

    const generatedTracking = trackingNumber || `TRK-${Date.now().toString().slice(-8)}`;

    await withTransaction(async (conn) => {
      // Row lock the shipment row!
      const [shipmentRows] = await conn.query(
        'SELECT * FROM shipments WHERE id = ? FOR UPDATE',
        [shipmentId]
      ) as any[];

      const shipment = shipmentRows[0];
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Concurrency guard: PREVENT DUPLICATE DISPATCH
      if (shipment.status === 'dispatched' || shipment.status === 'delivered') {
        const conflictErr: any = new Error(`Shipment ${shipment.shipment_number} has already been dispatched.`);
        conflictErr.statusCode = 409;
        throw conflictErr;
      }

      if (shipment.status === 'cancelled') {
        throw new Error('Cannot dispatch a cancelled shipment');
      }

      // Fetch items to deduct
      const [items] = await conn.query(
        'SELECT * FROM shipment_items WHERE shipment_id = ?',
        [shipmentId]
      ) as any[];

      if (items.length === 0) {
        throw new Error('Shipment has no items to dispatch');
      }

      // Deduct stock for each shipment item
      for (const item of items) {
        const qtyToShip = item.quantity_packed > 0 ? item.quantity_packed : item.quantity_ordered;

        // Lock inventory row in this warehouse
        const [invRows] = await conn.query(
          'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
          [item.product_id, shipment.warehouse_id]
        ) as any[];

        const inv = invRows[0];
        if (!inv || Number(inv.quantity_on_hand) < qtyToShip) {
          throw new Error(`Insufficient inventory on hand for product ID ${item.product_id} at warehouse #${shipment.warehouse_id}`);
        }

        // Deduct inventory quantity_on_hand and reserved_quantity
        await conn.query(
          `UPDATE inventory SET
             quantity_on_hand = quantity_on_hand - ?,
             reserved_quantity = GREATEST(0, reserved_quantity - ?),
             last_counted_at = NOW()
           WHERE id = ?`,
          [qtyToShip, qtyToShip, inv.id]
        );

        // Fulfill stock reservation if exists
        if (shipment.order_id) {
          await conn.query(
            `UPDATE stock_reservations SET
               status = "fulfilled",
               released_at = NOW()
             WHERE order_id = ? AND product_id = ? AND status = "active"
             LIMIT 1`,
            [shipment.order_id, item.product_id]
          );

          // Update order item quantity fulfilled
          await conn.query(
            'UPDATE order_items SET quantity_fulfilled = quantity_fulfilled + ? WHERE order_id = ? AND product_id = ?',
            [qtyToShip, shipment.order_id, item.product_id]
          );
        }

        // Record physical shipment movement
        await conn.query(
          'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, "ship", ?, "shipment", ?, ?, ?)',
          [item.product_id, shipment.warehouse_id, item.location_id, qtyToShip, shipmentId, `Dispatched shipment ${shipment.shipment_number}`, req.user!.id]
        );
      }

      // Update shipment record
      await conn.query(
        'UPDATE shipments SET status = "dispatched", tracking_number = ?, actual_ship_date = NOW() WHERE id = ?',
        [generatedTracking, shipmentId]
      );

      // Record status event
      await conn.query(
        'INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "dispatched", ?, ?)',
        [shipmentId, `Dispatched via ${shipment.carrier || 'carrier'}. Tracking: ${generatedTracking}`, req.user!.id]
      );

      // Update linked order status if all items fulfilled
      if (shipment.order_id) {
        const [oiRows] = await conn.query(
          'SELECT SUM(quantity_ordered) as total_ordered, SUM(quantity_fulfilled) as total_fulfilled FROM order_items WHERE order_id = ?',
          [shipment.order_id]
        ) as any[];

        const ordTotals = oiRows[0];
        const isFullyFulfilled = ordTotals && Number(ordTotals.total_fulfilled) >= Number(ordTotals.total_ordered);
        await conn.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [isFullyFulfilled ? 'fulfilled' : 'partially_fulfilled', shipment.order_id]
        );
      }

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "DISPATCH_SHIPMENT", "shipment", ?, ?, ?)',
        [req.user!.id, shipmentId, JSON.stringify({ shipmentNum: shipment.shipment_number, tracking: generatedTracking }), req.ip || '']
      );
    });

    const updated = await queryOne<any>('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    res.json({
      id: String(updated.id),
      shipmentNumber: updated.shipment_number,
      status: updated.status,
      trackingNumber: updated.tracking_number,
      shipDate: updated.actual_ship_date,
    });
  } catch (err: any) {
    console.error('Dispatch shipment error:', err);
    res.status(err.statusCode || 400).json({ message: err.message || 'Failed to dispatch shipment' });
  }
});

/**
 * POST /api/shipments/:id/mark-delivered
 */
router.post('/:id/mark-delivered', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    await pool.query(
      'UPDATE shipments SET status = "delivered", actual_delivery_date = NOW() WHERE id = ?',
      [shipmentId]
    );
    await pool.query(
      'INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "delivered", "Delivered to destination", ?)',
      [shipmentId, req.user!.id]
    );
    res.json({ message: 'Shipment marked as delivered' });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shipments/:id/cancel
 */
router.post('/:id/cancel', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipmentId = parseInt(req.params.id, 10);
    const shipment = await queryOne<any>('SELECT status FROM shipments WHERE id = ?', [shipmentId]);

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }
    if (shipment.status === 'dispatched' || shipment.status === 'delivered') {
      res.status(400).json({ message: 'Cannot cancel an already dispatched or delivered shipment' });
      return;
    }

    await pool.query('UPDATE shipments SET status = "cancelled" WHERE id = ?', [shipmentId]);
    await pool.query('INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, "cancelled", "Shipment cancelled", ?)', [shipmentId, req.user!.id]);

    res.json({ message: 'Shipment cancelled' });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/shipments/:id/pick-list
 */
router.get('/:id/pick-list', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipment = await queryOne<any>(
      `SELECT s.*, o.order_number, w.name as warehouse_name
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    const items = await query<any[]>(
      `SELECT si.*, p.name as product_name, p.sku, p.barcode, sl.label as location_code
       FROM shipment_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN storage_locations sl ON si.location_id = sl.id
       WHERE si.shipment_id = ?
       ORDER BY sl.label ASC, p.sku ASC`,
      [req.params.id]
    );

    res.json({
      shipment: {
        id: String(shipment.id),
        shipmentNumber: shipment.shipment_number,
        orderNumber: shipment.order_number,
        warehouseName: shipment.warehouse_name,
        recipientName: shipment.recipient_name,
        carrier: shipment.carrier,
        status: shipment.status,
      },
      items: items.map((i) => ({
        id: String(i.id),
        sku: i.sku,
        productName: i.product_name,
        barcode: i.barcode,
        quantityOrdered: Number(i.quantity_ordered),
        quantityPicked: Number(i.quantity_picked),
        locationCode: i.location_code || 'Zone A-01',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/shipments/:id/packing-slip
 */
router.get('/:id/packing-slip', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shipment = await queryOne<any>(
      `SELECT s.*, o.order_number, w.name as warehouse_name
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    const items = await query<any[]>(
      `SELECT si.*, p.name as product_name, p.sku, p.unit_of_measure
       FROM shipment_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.shipment_id = ?`,
      [req.params.id]
    );

    res.json({
      shipment: {
        id: String(shipment.id),
        shipmentNumber: shipment.shipment_number,
        orderNumber: shipment.order_number,
        recipientName: shipment.recipient_name,
        recipientAddress: shipment.shipping_address,
        carrier: shipment.carrier,
        trackingNumber: shipment.tracking_number,
        warehouseName: shipment.warehouse_name,
        shipDate: shipment.actual_ship_date || shipment.expected_ship_date,
      },
      items: items.map((i) => ({
        id: String(i.id),
        sku: i.sku,
        productName: i.product_name,
        quantityPacked: Number(i.quantity_packed || i.quantity_ordered),
        unitOfMeasure: i.unit_of_measure,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
