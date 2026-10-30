import { Router, Response } from 'express';
import { query, queryOne } from '../database/db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Real aggregated warehouse KPI counts from database
 */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const prodCountRes = await queryOne<any>('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const totalProducts = Number(prodCountRes?.count || 0);

    const stockSumRes = await queryOne<any>('SELECT COALESCE(SUM(quantity_on_hand), 0) as total FROM inventory');
    const unitsInStock = Number(stockSumRes?.total || 0);

    const lowStockRes = await queryOne<any>(
      `SELECT COUNT(DISTINCT product_id) as count
       FROM inventory
       WHERE quantity_on_hand <= reorder_threshold`
    );
    const lowStockItems = Number(lowStockRes?.count || 0);

    const pendingRecRes = await queryOne<any>(
      "SELECT COUNT(*) as count FROM inbound_receipts WHERE status IN ('draft', 'in_progress')"
    );
    const pendingReceipts = Number(pendingRecRes?.count || 0);

    const awaitDispatchRes = await queryOne<any>(
      "SELECT COUNT(*) as count FROM shipments WHERE status IN ('ready_to_pick', 'picking', 'packed')"
    );
    const shipmentsAwaitingDispatch = Number(awaitDispatchRes?.count || 0);

    const awaitOrdersRes = await queryOne<any>(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed', 'processing')"
    );
    const ordersAwaitingFulfillment = Number(awaitOrdersRes?.count || 0);

    res.json({
      totalProducts,
      unitsInStock,
      lowStockItems,
      pendingReceipts,
      shipmentsAwaitingDispatch,
      ordersAwaitingFulfillment,
    });
  } catch (err: any) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/shipment-distribution
 */
router.get('/shipment-distribution', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<any[]>(
      'SELECT status, COUNT(*) as count FROM shipments GROUP BY status'
    );

    const colorMap: Record<string, string> = {
      draft: '#9aa0a6',
      ready_to_pick: '#f9ab00',
      picking: '#1a73e8',
      packed: '#9334e6',
      dispatched: '#e37400',
      delivered: '#1e8e3e',
      cancelled: '#d93025',
    };

    const result = rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      color: colorMap[r.status] || '#5f6368',
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/stock-trends
 */
router.get('/stock-trends', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Generate recent 7-day movement trend
    const sql = `
      SELECT DATE(created_at) as date,
             SUM(CASE WHEN movement_type = 'receive' THEN quantity ELSE 0 END) as received,
             SUM(CASE WHEN movement_type = 'ship' THEN quantity ELSE 0 END) as shipped
      FROM inventory_movements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const rows = await query<any[]>(sql);

    // Get current total units in stock
    const stockRes = await queryOne<any>('SELECT COALESCE(SUM(quantity_on_hand), 0) as total FROM inventory');
    const baseStock = Number(stockRes?.total || 0);

    const trends = rows.map((r) => ({
      date: r.date,
      totalStock: baseStock,
      received: Number(r.received || 0),
      shipped: Number(r.shipped || 0),
    }));

    // If empty, provide baseline data for chart rendering
    if (trends.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      trends.push({
        date: today,
        totalStock: baseStock,
        received: 0,
        shipped: 0,
      });
    }

    res.json(trends);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/recent-activity
 */
router.get('/recent-activity', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const rows = await query<any[]>(
      `SELECT a.*, u.full_name as user_name
       FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const activities = rows.map((r) => {
      let detailsStr = '';
      if (typeof r.details === 'object' && r.details !== null) {
        detailsStr = Object.entries(r.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      } else {
        detailsStr = r.details || '';
      }

      return {
        id: String(r.id),
        userId: String(r.user_id || ''),
        userName: r.user_name || 'System Operator',
        action: r.action,
        entityType: r.entity_type,
        entityId: String(r.entity_id || ''),
        entityName: `${r.entity_type} #${r.entity_id || ''}`,
        details: detailsStr,
        createdAt: r.created_at,
      };
    });

    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/alerts
 */
router.get('/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alerts: any[] = [];

    // 1. Low stock alerts
    const lowStock = await query<any[]>(
      `SELECT p.id, p.name, p.sku, i.quantity_on_hand, i.reorder_threshold, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.quantity_on_hand <= i.reorder_threshold
       ORDER BY i.quantity_on_hand ASC
       LIMIT 5`
    );

    for (const item of lowStock) {
      alerts.push({
        id: `alert-stock-${item.id}`,
        type: 'low_stock',
        severity: item.quantity_on_hand === 0 ? 'error' : 'warning',
        title: item.quantity_on_hand === 0 ? `Stock Exhausted: ${item.sku}` : `Low Stock Alert: ${item.sku}`,
        description: `${item.name} has ${item.quantity_on_hand} units remaining at ${item.warehouse_name} (Threshold: ${item.reorder_threshold})`,
        entityId: String(item.id),
        entityType: 'product',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Pending receipts awaiting processing
    const pendingReceipts = await query<any[]>(
      `SELECT r.id, r.receipt_number, w.name as warehouse_name, r.created_at
       FROM inbound_receipts r
       JOIN warehouses w ON r.warehouse_id = w.id
       WHERE r.status = 'in_progress'
       LIMIT 3`
    );

    for (const rec of pendingReceipts) {
      alerts.push({
        id: `alert-rec-${rec.id}`,
        type: 'pending_receipt',
        severity: 'info',
        title: `Receiving In Progress: ${rec.receipt_number}`,
        description: `Shipment intake ongoing at ${rec.warehouse_name}. Review line item counts for completion.`,
        entityId: String(rec.id),
        entityType: 'receipt',
        createdAt: rec.created_at,
      });
    }

    // 3. Urgent orders pending
    const urgentOrders = await query<any[]>(
      `SELECT id, order_number, customer_name
       FROM orders
       WHERE status = 'pending' AND priority = 'urgent'
       LIMIT 3`
    );

    for (const ord of urgentOrders) {
      alerts.push({
        id: `alert-ord-${ord.id}`,
        type: 'cancelled_order',
        severity: 'error',
        title: `Urgent Order Pending: ${ord.order_number}`,
        description: `Customer ${ord.customer_name} marked as urgent priority requires allocation approval.`,
        entityId: String(ord.id),
        entityType: 'order',
        createdAt: new Date().toISOString(),
      });
    }

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
