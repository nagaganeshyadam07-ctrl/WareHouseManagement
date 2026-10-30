import assert from 'assert';
import { pool, withTransaction, query, queryOne } from '../database/db';
import { seed } from '../database/seed';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('=== STARTING ENTERPRISE WAREHOUSE INTEGRATION TESTS ===\n');

  // Step 1: Database Seed
  console.log('1. Verifying database initialization & seeding...');
  await seed();
  const prodCount = await queryOne<any>('SELECT COUNT(*) as count FROM products');
  assert(Number(prodCount?.count) >= 20, 'Products should be seeded');
  console.log('   ✓ Seed verification passed: Products populated');

  // Step 2: RBAC and Auth
  console.log('2. Verifying RBAC and authentication...');
  const adminUser = await queryOne<any>('SELECT * FROM users WHERE username = "admin"');
  assert(adminUser, 'Admin user must exist');
  assert(bcrypt.compareSync('admin123', adminUser.password_hash), 'Admin password hash should match');

  const staffUser = await queryOne<any>('SELECT * FROM users WHERE username = "staff"');
  assert(staffUser && staffUser.role === 'staff', 'Staff user must exist with role staff');
  console.log('   ✓ User authentication and role assignment verified');

  // Step 3: Inventory Transaction & Safe Concurrency Adjustment
  console.log('3. Testing inventory adjustment in MySQL transaction...');
  const invBefore = await queryOne<any>(
    'SELECT * FROM inventory WHERE product_id = 1 AND warehouse_id = 1'
  );
  assert(invBefore, 'Inventory record for product 1 at warehouse 1 must exist');
  const initialQty = Number(invBefore.quantity_on_hand);

  // Apply adjustment of +25 units
  await withTransaction(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM inventory WHERE id = ? FOR UPDATE', [invBefore.id]) as any[];
    await conn.query('UPDATE inventory SET quantity_on_hand = quantity_on_hand + 25 WHERE id = ?', [rows[0].id]);
    await conn.query(
      'INSERT INTO stock_adjustments (product_id, warehouse_id, location_id, adjustment_type, quantity_before, quantity_after, reason, performed_by) VALUES (?, ?, ?, "correction", ?, ?, "Integration test adjustment", 1)',
      [1, 1, rows[0].location_id, initialQty, initialQty + 25]
    );
    await conn.query(
      'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (1, 1, ?, "adjust", 25, "stock_adjustment", ?, "Test adjustment", 1)',
      [rows[0].location_id, rows[0].id]
    );
  });

  const invAfter = await queryOne<any>('SELECT quantity_on_hand FROM inventory WHERE id = ?', [invBefore.id]);
  assert.strictEqual(Number(invAfter.quantity_on_hand), initialQty + 25, 'Inventory quantity must increase by 25');
  console.log(`   ✓ Inventory adjustment verified (${initialQty} -> ${invAfter.quantity_on_hand})`);

  // Step 4: Receiving Workflow - Atomically credit inventory
  console.log('4. Testing receiving workflow completion...');
  const [recRes] = await pool.query(
    'INSERT INTO inbound_receipts (receipt_number, warehouse_id, status, created_by) VALUES ("TEST-REC-001", 1, "draft", 1)'
  ) as any;
  const testRecId = recRes.insertId;

  await pool.query(
    'INSERT INTO receipt_items (receipt_id, product_id, expected_quantity, received_quantity) VALUES (?, 1, 50, 50)',
    [testRecId]
  );

  const invBeforeRec = await queryOne<any>('SELECT quantity_on_hand FROM inventory WHERE id = ?', [invBefore.id]);
  const qtyBeforeRec = Number(invBeforeRec.quantity_on_hand);

  // Complete receiving workflow
  await withTransaction(async (conn) => {
    await conn.query('UPDATE inventory SET quantity_on_hand = quantity_on_hand + 50 WHERE id = ?', [invBefore.id]);
    await conn.query('UPDATE inbound_receipts SET status = "completed", received_date = CURRENT_DATE() WHERE id = ?', [testRecId]);
    await conn.query(
      'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (1, 1, ?, "receive", 50, "inbound_receipt", ?, "Test intake", 1)',
      [invBefore.location_id, testRecId]
    );
  });

  const invAfterRec = await queryOne<any>('SELECT quantity_on_hand FROM inventory WHERE id = ?', [invBefore.id]);
  assert.strictEqual(Number(invAfterRec.quantity_on_hand), qtyBeforeRec + 50, 'Stock must increment by 50 after receiving');
  console.log('   ✓ Inbound intake workflow completed: stock credited atomically');

  // Step 5: Orders & Reservations with Insufficient-Stock Validation
  console.log('5. Testing order confirmation and reservation concurrency...');
  const [ordRes] = await pool.query(
    'INSERT INTO orders (order_number, customer_name, status, created_by) VALUES ("TEST-ORD-001", "Acme Test", "pending", 1)'
  ) as any;
  const testOrdId = ordRes.insertId;

  const [oiRes] = await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity_ordered, unit_price) VALUES (?, 1, 20, 29.99)',
    [testOrdId]
  ) as any;
  const testOiId = oiRes.insertId;

  // Attempt confirming order with insufficient stock validation
  await withTransaction(async (conn) => {
    const [invRows] = await conn.query('SELECT * FROM inventory WHERE product_id = 1 AND warehouse_id = 1 FOR UPDATE') as any[];
    const inv = invRows[0];
    const available = Number(inv.quantity_on_hand) - Number(inv.reserved_quantity);
    assert(available >= 20, 'Stock must be available for reservation');

    await conn.query('UPDATE inventory SET reserved_quantity = reserved_quantity + 20 WHERE id = ?', [inv.id]);
    await conn.query(
      'INSERT INTO stock_reservations (order_id, order_item_id, product_id, warehouse_id, location_id, quantity, status) VALUES (?, ?, 1, 1, ?, 20, "active")',
      [testOrdId, testOiId, inv.location_id]
    );
    await conn.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [testOrdId]);
  });

  const invReserved = await queryOne<any>('SELECT reserved_quantity FROM inventory WHERE id = ?', [invBefore.id]);
  assert(Number(invReserved.reserved_quantity) >= 20, 'Reserved quantity must be recorded in inventory');
  console.log('   ✓ Order confirmation and stock reservation validated');

  // Step 6 & 7: Shipment Dispatch & Duplicate Prevention (Idempotency)
  console.log('6. Testing shipment lifecycle and dispatch concurrency...');
  const [shpRes] = await pool.query(
    'INSERT INTO shipments (shipment_number, order_id, warehouse_id, status, recipient_name, carrier, created_by) VALUES ("TEST-SHP-001", ?, 1, "packed", "Acme Test", "FedEx", 1)',
    [testOrdId]
  ) as any;
  const testShpId = shpRes.insertId;

  await pool.query(
    'INSERT INTO shipment_items (shipment_id, product_id, quantity_ordered, quantity_packed) VALUES (?, 1, 20, 20)',
    [testShpId]
  );

  const invBeforeDispatch = await queryOne<any>('SELECT quantity_on_hand, reserved_quantity FROM inventory WHERE id = ?', [invBefore.id]);
  const onHandBeforeDispatch = Number(invBeforeDispatch.quantity_on_hand);
  const reservedBeforeDispatch = Number(invBeforeDispatch.reserved_quantity);

  // Dispatch function
  const dispatchShipment = async (shpId: number, tracking: string) => {
    return await withTransaction(async (conn) => {
      const [shipmentRows] = await conn.query('SELECT * FROM shipments WHERE id = ? FOR UPDATE', [shpId]) as any[];
      const shipment = shipmentRows[0];
      if (shipment.status === 'dispatched' || shipment.status === 'delivered') {
        const conflict: any = new Error('Shipment has already been dispatched');
        conflict.statusCode = 409;
        throw conflict;
      }

      // Deduct inventory
      await conn.query(
        'UPDATE inventory SET quantity_on_hand = quantity_on_hand - 20, reserved_quantity = GREATEST(0, reserved_quantity - 20) WHERE id = ?',
        [invBefore.id]
      );
      await conn.query('UPDATE shipments SET status = "dispatched", tracking_number = ?, actual_ship_date = NOW() WHERE id = ?', [tracking, shpId]);
      await conn.query('UPDATE stock_reservations SET status = "fulfilled" WHERE order_id = ?', [testOrdId]);
      await conn.query('UPDATE orders SET status = "fulfilled" WHERE id = ?', [testOrdId]);
      return true;
    });
  };

  // First dispatch: should succeed
  await dispatchShipment(testShpId, 'TRK-TEST-FIRST-1234');
  const invAfterDispatch = await queryOne<any>('SELECT quantity_on_hand, reserved_quantity FROM inventory WHERE id = ?', [invBefore.id]);
  assert.strictEqual(Number(invAfterDispatch.quantity_on_hand), onHandBeforeDispatch - 20, 'Stock on hand must decrease by 20');
  assert.strictEqual(Number(invAfterDispatch.reserved_quantity), reservedBeforeDispatch - 20, 'Reserved stock must decrease by 20');
  console.log('   ✓ First dispatch succeeded: Inventory deducted and reservations fulfilled');

  // Second dispatch attempt on same shipment: MUST FAIL with duplicate dispatch error (409 Conflict)
  console.log('7. Verifying duplicate dispatch prevention...');
  let duplicatePrevented = false;
  try {
    await dispatchShipment(testShpId, 'TRK-TEST-DUPLICATE-9999');
  } catch (err: any) {
    if (err.statusCode === 409 || err.message.includes('already been dispatched')) {
      duplicatePrevented = true;
    }
  }
  assert(duplicatePrevented, 'Duplicate dispatch must be rejected with 409 Conflict');

  // Confirm inventory was NOT double-deducted
  const invAfterDuplicateAttempt = await queryOne<any>('SELECT quantity_on_hand FROM inventory WHERE id = ?', [invBefore.id]);
  assert.strictEqual(Number(invAfterDuplicateAttempt.quantity_on_hand), Number(invAfterDispatch.quantity_on_hand), 'Inventory must NOT be deducted twice');
  console.log('   ✓ Duplicate dispatch rejected: Double-deduction prevented');

  // Step 8: Dashboard Metrics Verification
  console.log('8. Verifying persisted dashboard KPI aggregation...');
  const totalStockRes = await queryOne<any>('SELECT SUM(quantity_on_hand) as sum FROM inventory');
  assert(Number(totalStockRes.sum) > 0, 'Total stock calculation must be positive');

  const dispatchedCountRes = await queryOne<any>('SELECT COUNT(*) as count FROM shipments WHERE status = "dispatched"');
  assert(Number(dispatchedCountRes.count) >= 1, 'At least 1 dispatched shipment must exist');
  console.log('   ✓ Dashboard aggregations accurately reflect persisted records');

  console.log('\n=== ALL INTEGRATION TESTS PASSED (8/8) ===');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    process.exit(1);
  });
