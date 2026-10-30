import { Router, Response } from 'express';
import { pool, query, queryOne } from '../database/db';
import { AuthenticatedRequest, requireAuth, requireRole, logAudit } from '../middleware/auth';
import { parsePagination, parseSort, paginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/products
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['id', 'sku', 'name', 'unit_cost', 'created_at', 'category_id'], 'name');
    const { search, category_id, category, is_active, status } = req.query;

    let where = '1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category_id) {
      where += ' AND p.category_id = ?';
      params.push(parseInt(category_id as string, 10));
    } else if (category) {
      where += ' AND (c.name = ? OR p.category_id = ?)';
      params.push(category, category);
    }
    if (is_active !== undefined) {
      where += ' AND p.is_active = ?';
      params.push(parseInt(is_active as string, 10));
    }
    if (status) {
      if (status === 'active') {
        where += ' AND p.is_active = 1';
      } else if (status === 'archived' || status === 'inactive') {
        where += ' AND p.is_active = 0';
      }
    }

    const countRes = await query<any[]>(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}`,
      params
    );
    const total = countRes[0]?.total || 0;

    const sortCol = sort.sortBy === 'category_id' ? 'p.category_id' : `p.${sort.sortBy}`;
    const sql = `
      SELECT p.id, p.sku, p.name, p.description, p.category_id,
             p.barcode, p.unit_of_measure, p.unit_cost, p.reorder_threshold,
             p.is_active, p.created_at, p.updated_at,
             c.name as category,
             COALESCE((SELECT SUM(quantity_on_hand) FROM inventory WHERE product_id = p.id), 0) as total_stock,
             COALESCE((SELECT SUM(reserved_quantity) FROM inventory WHERE product_id = p.id), 0) as total_reserved
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where}
      ORDER BY ${sortCol} ${sort.sortOrder}
      LIMIT ? OFFSET ?
    `;

    const rows = await query<any[]>(sql, [...params, pagination.limit, pagination.offset]);

    // Format products for client
    const products = rows.map((r) => ({
      id: String(r.id),
      sku: r.sku,
      name: r.name,
      description: r.description || '',
      category: r.category || 'Uncategorized',
      categoryId: r.category_id,
      barcode: r.barcode || '',
      unitOfMeasure: r.unit_of_measure,
      unitCost: Number(r.unit_cost),
      reorderThreshold: r.reorder_threshold,
      reorderQuantity: r.reorder_threshold * 2,
      totalStock: Number(r.total_stock),
      totalReserved: Number(r.total_reserved),
      availableStock: Math.max(0, Number(r.total_stock) - Number(r.total_reserved)),
      status: r.is_active ? 'active' : 'archived',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json(paginatedResponse(products, total, pagination));
  } catch (err: any) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await queryOne<any>(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const stock = await query<any[]>(
      `SELECT i.*, w.name as warehouse_name, sl.label as location_label
       FROM inventory i
       JOIN warehouses w ON i.warehouse_id = w.id
       LEFT JOIN storage_locations sl ON i.location_id = sl.id
       WHERE i.product_id = ?`,
      [req.params.id]
    );

    res.json({
      id: String(product.id),
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category_name,
      categoryId: product.category_id,
      barcode: product.barcode,
      unitOfMeasure: product.unit_of_measure,
      unitCost: Number(product.unit_cost),
      reorderThreshold: product.reorder_threshold,
      status: product.is_active ? 'active' : 'archived',
      stock,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    });
  } catch (err: any) {
    console.error('Get product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/products
 */
router.post('/', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sku, name, description, category_id, category, barcode, unit_of_measure, unit_cost, reorder_threshold } = req.body;

    if (!sku || !name) {
      res.status(400).json({ message: 'SKU and product name are required' });
      return;
    }

    // Resolve category id if category name given
    let catId = category_id ? parseInt(category_id, 10) : null;
    if (!catId && category) {
      const catRow = await queryOne<any>('SELECT id FROM categories WHERE name = ?', [category]);
      if (catRow) catId = catRow.id;
    }

    const [result] = await pool.query(
      `INSERT INTO products (sku, name, description, category_id, barcode, unit_of_measure, unit_cost, reorder_threshold, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        sku,
        name,
        description || null,
        catId,
        barcode || null,
        unit_of_measure || 'EA',
        unit_cost ? parseFloat(unit_cost) : 0.0,
        reorder_threshold ? parseInt(reorder_threshold, 10) : 10,
      ]
    ) as any;

    const newProd = await queryOne<any>('SELECT * FROM products WHERE id = ?', [result.insertId]);

    await logAudit(req.user!.id, 'CREATE_PRODUCT', 'product', result.insertId, { sku, name }, req.ip || '');

    res.status(201).json({
      id: String(newProd.id),
      sku: newProd.sku,
      name: newProd.name,
      description: newProd.description,
      barcode: newProd.barcode,
      unitOfMeasure: newProd.unit_of_measure,
      unitCost: Number(newProd.unit_cost),
      reorderThreshold: newProd.reorder_threshold,
      status: 'active',
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'A product with this SKU or Barcode already exists' });
      return;
    }
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', requireAuth, requireRole('admin', 'manager'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category_id, barcode, unit_of_measure, unit_cost, reorder_threshold, status } = req.body;

    const existing = await queryOne<any>('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const isActive = status === 'active' ? 1 : status === 'archived' ? 0 : existing.is_active;

    await pool.query(
      `UPDATE products SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         category_id = COALESCE(?, category_id),
         barcode = COALESCE(?, barcode),
         unit_of_measure = COALESCE(?, unit_of_measure),
         unit_cost = COALESCE(?, unit_cost),
         reorder_threshold = COALESCE(?, reorder_threshold),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name,
        description,
        category_id ? parseInt(category_id, 10) : null,
        barcode,
        unit_of_measure,
        unit_cost !== undefined ? parseFloat(unit_cost) : null,
        reorder_threshold !== undefined ? parseInt(reorder_threshold, 10) : null,
        isActive,
        req.params.id,
      ]
    );

    const updated = await queryOne<any>('SELECT * FROM products WHERE id = ?', [req.params.id]);
    await logAudit(req.user!.id, 'UPDATE_PRODUCT', 'product', Number(req.params.id), { name, barcode }, req.ip || '');

    res.json({
      id: String(updated.id),
      sku: updated.sku,
      name: updated.name,
      description: updated.description,
      barcode: updated.barcode,
      unitOfMeasure: updated.unit_of_measure,
      unitCost: Number(updated.unit_cost),
      reorderThreshold: updated.reorder_threshold,
      status: updated.is_active ? 'active' : 'archived',
    });
  } catch (err: any) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existing = await queryOne<any>('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Soft delete product by marking inactive
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    await logAudit(req.user!.id, 'ARCHIVE_PRODUCT', 'product', Number(req.params.id), { sku: existing.sku }, req.ip || '');

    res.json({ message: 'Product archived successfully' });
  } catch (err: any) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
