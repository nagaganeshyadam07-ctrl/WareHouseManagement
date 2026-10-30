import { Router, Response } from 'express';
import { pool, query, queryOne, withTransaction } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/orders
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const { status, priority, search } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND o.status = ?';
      params.push(status);
    }
    if (priority) {
      where += ' AND o.priority = ?';
      params.push(priority);
    }
    if (search) {
      where += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total FROM orders o WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sql = `
      SELECT o.*,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count,
             (SELECT COALESCE(SUM(oi.quantity_ordered * oi.unit_price), 0) FROM order_items oi WHERE oi.order_id = o.id) as total_amount,
             (SELECT COUNT(*) FROM shipments s WHERE s.order_id = o.id) as shipments_count
      FROM orders o
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    const orders = rows.map((r) => ({
      id: String(r.id),
      orderNumber: r.order_number,
      customerName: r.customer_name,
      customerEmail: r.customer_email || '',
      customerPhone: r.customer_phone || '',
      shippingAddress: r.shipping_address || '',
      status: r.status,
      priority: r.priority,
      itemsCount: Number(r.items_count || 0),
      totalAmount: Number(r.total_amount || 0),
      shipmentsCount: Number(r.shipments_count || 0),
      notes: r.notes || '',
      orderDate: r.order_date || r.created_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(paginatedResponse(orders, total, pagination));
  } catch (err: any) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const order = await queryOne<any>(
      `SELECT o.*,
         (SELECT COUNT(*) FROM shipments s WHERE s.order_id = o.id) as shipments_count
       FROM orders o
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const items = await query<any[]>(
      `SELECT oi.*, p.name as product_name, p.sku,
         COALESCE((SELECT SUM(quantity_on_hand - reserved_quantity) FROM inventory WHERE product_id = oi.product_id), 0) as available_stock,
         (SELECT status FROM stock_reservations sr WHERE sr.order_item_id = oi.id LIMIT 1) as reservation_status
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity_ordered) * Number(item.unit_price)), 0);

    res.json({
      id: String(order.id),
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      status: order.status,
      priority: order.priority,
      notes: order.notes,
      itemsCount: items.length,
      totalAmount,
      shipmentsCount: Number(order.shipments_count || 0),
      orderDate: order.order_date || order.created_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map((item) => ({
        id: String(item.id),
        orderId: String(item.order_id),
        productId: String(item.product_id),
        productName: item.product_name,
        sku: item.sku,
        quantityOrdered: Number(item.quantity_ordered),
        quantityFulfilled: Number(item.quantity_fulfilled),
        unitPrice: Number(item.unit_price),
        availableStock: Math.max(0, Number(item.available_stock || 0)),
        status: item.reservation_status === 'active' ? 'reserved' : item.quantity_fulfilled >= item.quantity_ordered ? 'fulfilled' : 'pending',
      })),
    });
  } catch (err: any) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/orders/:id/availability
 * Real-time stock check for items in order
 */
router.get('/:id/availability', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const items = await query<any[]>(
      `SELECT oi.product_id, oi.quantity_ordered,
         COALESCE((SELECT SUM(quantity_on_hand - reserved_quantity) FROM inventory WHERE product_id = oi.product_id), 0) as available
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({
      items: items.map((i) => ({
        productId: String(i.product_id),
        required: Number(i.quantity_ordered),
        available: Math.max(0, Number(i.available)),
        isAvailable: Number(i.available) >= Number(i.quantity_ordered),
      })),
    });
  } catch (err: any) {
    console.error('Check order availability error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/orders
 */
router.post('/', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, priority, notes, items } = req.body;

    if (!customerName || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Customer name, shipping address, and at least one item are required' });
      return;
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    let orderId = 0;
    await withTransaction(async (conn) => {
      const [ordRes] = await conn.query(
        'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, priority, notes, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)',
        [orderNumber, customerName, customerEmail || null, customerPhone || null, shippingAddress, priority || 'normal', notes || null, req.user!.id]
      ) as any;
      orderId = ordRes.insertId;

      for (const item of items) {
        const prodId = parseInt(item.productId, 10);
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unitPrice) || 0.0;

        await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity_ordered, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, prodId, qty, price]
        );
      }

      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "CREATE_ORDER", "order", ?, ?, ?)',
        [req.user!.id, orderId, JSON.stringify({ orderNumber, itemsCount: items.length }), req.ip || '']
      );
    });

    res.status(201).json({ id: String(orderId), orderNumber, status: 'pending' });
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/orders/:id/confirm
 * Order confirmation with insufficient stock validation & atomic reservation in MySQL
 */
router.post('/:id/confirm', requireAuth, requireRole('admin', 'manager', 'staff'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);

    await withTransaction(async (conn) => {
      const [orderRows] = await conn.query(
        'SELECT * FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      ) as any[];

      const order = orderRows[0];
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error(`Only pending orders can be confirmed (current status: ${order.status})`);
      }

      const [items] = await conn.query(
        `SELECT oi.*, p.sku, p.name as product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      ) as any[];

      if (items.length === 0) {
        throw new Error('Order has no items to fulfill');
      }

      // Check stock availability and reserve
      for (const item of items) {
        // Lock inventory rows for this product
        const [invRows] = await conn.query(
          'SELECT * FROM inventory WHERE product_id = ? FOR UPDATE',
          [item.product_id]
        ) as any[];

        let needed = item.quantity_ordered;
        let totalAvail = 0;
        for (const inv of invRows) {
          totalAvail += (Number(inv.quantity_on_hand) - Number(inv.reserved_quantity));
        }

        if (totalAvail < needed) {
          throw new Error(`Insufficient stock for "${item.sku} - ${item.product_name}". Available: ${totalAvail}, Required: ${needed}`);
        }

        // Allocate reservation across inventory rows
        for (const inv of invRows) {
          if (needed <= 0) break;
          const availInRow = Number(inv.quantity_on_hand) - Number(inv.reserved_quantity);
          if (availInRow > 0) {
            const alloc = Math.min(availInRow, needed);
            await conn.query(
              'UPDATE inventory SET reserved_quantity = reserved_quantity + ? WHERE id = ?',
              [alloc, inv.id]
            );

            await conn.query(
              'INSERT INTO stock_reservations (order_id, order_item_id, product_id, warehouse_id, location_id, quantity, status) VALUES (?, ?, ?, ?, ?, ?, "active")',
              [orderId, item.id, item.product_id, inv.warehouse_id, inv.location_id, alloc]
            );

            needed -= alloc;
          }
        }
      }

      // Update order status to confirmed
      await conn.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [orderId]);

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "CONFIRM_ORDER", "order", ?, ?, ?)',
        [req.user!.id, orderId, JSON.stringify({ orderNumber: order.order_number }), req.ip || '']
      );
    });

    const updated = await queryOne<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.json({
      id: String(updated.id),
      orderNumber: updated.order_number,
      status: updated.status,
    });
  } catch (err: any) {
    console.error('Confirm order error:', err);
    res.status(400).json({ message: err.message || 'Failed to confirm order' });
  }
});

/**
 * POST /api/orders/:id/cancel
 * Order cancellation: Releases reserved stock back to available inventory
 */
router.post('/:id/cancel', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    await withTransaction(async (conn) => {
      const [orderRows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]) as any[];
      const order = orderRows[0];
      if (!order) throw new Error('Order not found');
      if (order.status === 'fulfilled') throw new Error('Cannot cancel an already fulfilled order');
      if (order.status === 'cancelled') throw new Error('Order is already cancelled');

      // Find active reservations
      const [reservations] = await conn.query(
        'SELECT * FROM stock_reservations WHERE order_id = ? AND status = "active"',
        [orderId]
      ) as any[];

      for (const res of reservations) {
        // Release reserved inventory
        await conn.query(
          'UPDATE inventory SET reserved_quantity = GREATEST(0, reserved_quantity - ?) WHERE product_id = ? AND warehouse_id = ?',
          [res.quantity, res.product_id, res.warehouse_id]
        );

        await conn.query(
          'UPDATE stock_reservations SET status = "released", released_at = NOW() WHERE id = ?',
          [res.id]
        );
      }

      // Cancel order
      await conn.query('UPDATE orders SET status = "cancelled", notes = CONCAT(COALESCE(notes, ""), " [Cancelled: ", ?, "]") WHERE id = ?', [reason || 'No reason provided', orderId]);

      // Audit log
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, "CANCEL_ORDER", "order", ?, ?, ?)',
        [req.user!.id, orderId, JSON.stringify({ orderNumber: order.order_number, reason }), req.ip || '']
      );
    });

    res.json({ message: 'Order cancelled and reservations released successfully' });
  } catch (err: any) {
    console.error('Cancel order error:', err);
    res.status(400).json({ message: err.message || 'Failed to cancel order' });
  }
});

export default router;
