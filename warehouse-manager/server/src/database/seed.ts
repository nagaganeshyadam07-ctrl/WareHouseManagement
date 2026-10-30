import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './db';
import { initializeDatabase } from './init';

export async function seed(): Promise<void> {
  console.log('Resetting and seeding MySQL database...');
  await initializeDatabase();

  const salt = bcrypt.genSaltSync(10);

  await withTransaction(async (conn) => {
    // 1. Users
    const users = [
      { username: 'admin', email: 'admin@warehouse.com', password: 'admin123', full_name: 'Alex Thompson', role: 'admin' },
      { username: 'manager', email: 'manager@warehouse.com', password: 'manager123', full_name: 'Sarah Chen', role: 'manager' },
      { username: 'staff', email: 'staff@warehouse.com', password: 'staff123', full_name: 'Mike Rodriguez', role: 'staff' },
      { username: 'viewer', email: 'viewer@warehouse.com', password: 'viewer123', full_name: 'Emily Davis', role: 'viewer' },
    ];

    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, salt);
      await conn.query(
        'INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [u.username, u.email, hash, u.full_name, u.role]
      );
    }
    console.log('Seeded users.');

    // 2. Categories
    const categories = [
      { name: 'Electronics', description: 'Consumer and industrial electronics, cables, and accessories' },
      { name: 'Clothing', description: 'Apparel, footwear, and textile products' },
      { name: 'Food & Beverage', description: 'Packaged food items, snacks, and drinks' },
      { name: 'Industrial', description: 'Safety equipment, tools, and industrial supplies' },
      { name: 'Office Supplies', description: 'Paper, pens, folders, and office equipment' },
      { name: 'Automotive', description: 'Vehicle parts, accessories, and maintenance products' },
    ];

    for (const c of categories) {
      await conn.query('INSERT INTO categories (name, description) VALUES (?, ?)', [c.name, c.description]);
    }
    console.log('Seeded categories.');

    // 3. Warehouses
    const warehouses = [
      { name: 'Main Fulfillment Hub', code: 'WH-001', address: '1500 Industrial Blvd', city: 'Dallas', state: 'TX', country: 'USA', capacity: 25000 },
      { name: 'East Distribution Center', code: 'WH-002', address: '820 Commerce Way', city: 'Atlanta', state: 'GA', country: 'USA', capacity: 18000 },
      { name: 'West Coast Logistics Center', code: 'WH-003', address: '3200 Pacific Ave', city: 'Portland', state: 'OR', country: 'USA', capacity: 15000 },
    ];

    for (const w of warehouses) {
      await conn.query(
        'INSERT INTO warehouses (name, code, address, city, state, country, capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [w.name, w.code, w.address, w.city, w.state, w.country, w.capacity]
      );
    }
    console.log('Seeded warehouses.');

    // 4. Storage Locations
    const warehouseZones: Record<number, string[]> = {
      1: ['Zone A - Inbound', 'Zone B - High Density', 'Zone C - Electronics', 'Zone D - Bulk Storage'],
      2: ['Zone A - Receiving', 'Zone B - Fast Pick', 'Zone C - Cold Storage'],
      3: ['Zone A - Staging', 'Zone B - Standard Pallet', 'Zone C - Oversize'],
    };

    for (const [whId, zones] of Object.entries(warehouseZones)) {
      for (const zone of zones) {
        for (const aisle of ['A', 'B', 'C']) {
          for (let rack = 1; rack <= 3; rack++) {
            for (let bin = 1; bin <= 2; bin++) {
              const rackStr = rack.toString().padStart(2, '0');
              const binStr = bin.toString().padStart(2, '0');
              const zoneCode = zone.split(' ')[0] + '-' + zone.split(' ')[1];
              const label = `${zoneCode}-${aisle}${rackStr}-${binStr}`;
              await conn.query(
                'INSERT INTO storage_locations (warehouse_id, zone, aisle, rack, bin, label, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [parseInt(whId), zone, aisle, rackStr, binStr, label]
              );
            }
          }
        }
      }
    }
    console.log('Seeded storage locations.');

    // 5. Suppliers
    const suppliers = [
      { name: 'TechParts Global', code: 'SUP-001', contact: 'James Wilson', email: 'james@techpartsglobal.com', phone: '+1-555-0101', address: '400 Tech Pkwy', city: 'San Jose', state: 'CA', country: 'USA' },
      { name: 'Pacific Textiles Inc', code: 'SUP-002', contact: 'Linda Nguyen', email: 'linda@pacifictextiles.com', phone: '+1-555-0102', address: '88 Fabric Lane', city: 'Los Angeles', state: 'CA', country: 'USA' },
      { name: 'MegaFood Distributors', code: 'SUP-003', contact: 'Bob Martinez', email: 'bob@megafood.com', phone: '+1-555-0103', address: '220 Harvest Rd', city: 'Chicago', state: 'IL', country: 'USA' },
      { name: 'SafetyFirst Equipment', code: 'SUP-004', contact: 'Karen Brooks', email: 'karen@safetyfirst.com', phone: '+1-555-0104', address: '55 Shield Ave', city: 'Houston', state: 'TX', country: 'USA' },
      { name: 'OfficeMax Wholesale', code: 'SUP-005', contact: 'David Park', email: 'david@officemaxwholesale.com', phone: '+1-555-0105', address: '730 Paper Ct', city: 'Phoenix', state: 'AZ', country: 'USA' },
      { name: 'AutoZone Parts Supply', code: 'SUP-006', contact: 'Rachel Green', email: 'rachel@autozoneparts.com', phone: '+1-555-0106', address: '1200 Motor Blvd', city: 'Detroit', state: 'MI', country: 'USA' },
    ];

    for (const s of suppliers) {
      await conn.query(
        'INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, state, country, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [s.name, s.code, s.contact, s.email, s.phone, s.address, s.city, s.state, s.country]
      );
    }
    console.log('Seeded suppliers.');

    // 6. Products
    const products = [
      // Electronics (cat: 1)
      { sku: 'ELEC-001', name: 'USB-C Multiport Hub 7-in-1', desc: '4K HDMI, 3x USB-A 3.0, 100W PD, SD card slot', cat: 1, barcode: '8901234567001', uom: 'EA', cost: 24.50, threshold: 20 },
      { sku: 'ELEC-002', name: 'Ergonomic Vertical Wireless Mouse', desc: '2.4GHz + Bluetooth dual mode, 4000 DPI sensor', cat: 1, barcode: '8901234567002', uom: 'EA', cost: 18.25, threshold: 25 },
      { sku: 'ELEC-003', name: 'Ultra High-Speed HDMI 2.1 Cable (2m)', desc: 'Braided jacket, 48Gbps 8K@60Hz / 4K@120Hz', cat: 1, barcode: '8901234567003', uom: 'EA', cost: 8.90, threshold: 50 },
      { sku: 'ELEC-004', name: 'Aluminum Laptop Riser Stand', desc: 'Foldable ergonomic stand with cooling vents', cat: 1, barcode: '8901234567004', uom: 'EA', cost: 32.00, threshold: 15 },
      { sku: 'ELEC-005', name: 'Rugged Waterproof Bluetooth Speaker', desc: 'IP67 waterproof, 16W stereo driver, 14hr battery', cat: 1, barcode: '8901234567005', uom: 'EA', cost: 29.95, threshold: 20 },
      { sku: 'ELEC-006', name: '1080p 60FPS Streaming Webcam', desc: 'Dual noise-cancelling mics, autofocus, privacy cover', cat: 1, barcode: '8901234567006', uom: 'EA', cost: 42.00, threshold: 15 },

      // Clothing (cat: 2)
      { sku: 'CLTH-001', name: 'Industrial Work Polo Shirt Navy (L)', desc: 'Breathable moisture-wicking heavy duty polyester-cotton', cat: 2, barcode: '8901234567010', uom: 'EA', cost: 14.50, threshold: 30 },
      { sku: 'CLTH-002', name: 'High-Visibility Class 2 Safety Vest (XL)', desc: 'Reflective silver strips, zipper front, 4 pockets', cat: 2, barcode: '8901234567011', uom: 'EA', cost: 8.50, threshold: 40 },
      { sku: 'CLTH-003', name: 'Steel-Toe Waterproof Work Boots (Size 10)', desc: 'Full-grain leather, puncture resistant steel plate', cat: 2, barcode: '8901234567012', uom: 'PR', cost: 68.00, threshold: 12 },
      { sku: 'CLTH-004', name: 'Impact & Cut Resistant Work Gloves (M)', desc: 'ANSI Cut Level A4, nitrile coated palm, touchscreen ready', cat: 2, barcode: '8901234567013', uom: 'PR', cost: 12.50, threshold: 25 },

      // Food & Beverage (cat: 3)
      { sku: 'FOOD-001', name: 'Organic Granola Bar Variety Pack (48ct)', desc: 'Assorted almond, peanut butter, and dark chocolate bars', cat: 3, barcode: '8901234567020', uom: 'CS', cost: 22.50, threshold: 20 },
      { sku: 'FOOD-002', name: 'Natural Spring Water 500ml (24-Pack)', desc: 'Recycled PET bottles, balanced mineral water', cat: 3, barcode: '8901234567021', uom: 'CS', cost: 6.75, threshold: 35 },
      { sku: 'FOOD-003', name: 'Artisan Roast Instant Coffee (100-Pack)', desc: 'Single serve medium roast 100% Arabica packets', cat: 3, barcode: '8901234567022', uom: 'BX', cost: 27.90, threshold: 15 },

      // Industrial (cat: 4)
      { sku: 'INDL-001', name: 'Anti-Fog Industrial Safety Goggles', desc: 'ANSI Z87.1 certified, UV400 protection, vented frame', cat: 4, barcode: '8901234567030', uom: 'EA', cost: 7.20, threshold: 50 },
      { sku: 'INDL-002', name: 'Heavy-Duty Pallet Jack 5,500 lbs', desc: 'Polyurethane wheels, 48-inch forks, reinforced steel frame', cat: 4, barcode: '8901234567031', uom: 'EA', cost: 295.00, threshold: 3 },
      { sku: 'INDL-003', name: 'Cast Stretch Shrink Wrap 18" x 1500ft', desc: '80 gauge thickness, high tensile clarity wrap', cat: 4, barcode: '8901234567032', uom: 'RL', cost: 15.80, threshold: 25 },
      { sku: 'INDL-004', name: 'Commercial Packing Tape 3" (6-Pack)', desc: 'Heavy-duty acrylic adhesive, 110 yards per roll', cat: 4, barcode: '8901234567033', uom: 'PK', cost: 11.20, threshold: 30 },
      { sku: 'INDL-005', name: 'OSHA Compliant Ventilated Hard Hat (White)', desc: 'Ratchet suspension, accessory slots, sweatband', cat: 4, barcode: '8901234567034', uom: 'EA', cost: 13.50, threshold: 20 },

      // Office Supplies (cat: 5)
      { sku: 'OFFC-001', name: 'Multipurpose Copy Paper 500 Sheets 20lb', desc: 'Acid-free bright white 92 brightness 8.5x11', cat: 5, barcode: '8901234567040', uom: 'RM', cost: 5.25, threshold: 50 },
      { sku: 'OFFC-002', name: 'Retractable Ballpoint Pens 1.0mm (12pk)', desc: 'Smear-proof black ink, rubber comfort grip', cat: 5, barcode: '8901234567041', uom: 'PK', cost: 3.80, threshold: 40 },
      { sku: 'OFFC-003', name: 'Heavyweight Manila File Folders (100pk)', desc: '1/3-cut tabs, letter size, durable paper stock', cat: 5, barcode: '8901234567042', uom: 'BX', cost: 14.50, threshold: 20 },
      { sku: 'OFFC-004', name: 'Low Odor Chisel Dry Erase Markers (8pk)', desc: 'Vibrant quick-drying colors, easily erases', cat: 5, barcode: '8901234567043', uom: 'PK', cost: 6.80, threshold: 25 },

      // Automotive (cat: 6)
      { sku: 'AUTO-001', name: 'Full Synthetic Motor Oil 5W-30 (5-Quart)', desc: 'Advanced wear protection, dexos1 Gen3 approved', cat: 6, barcode: '8901234567050', uom: 'EA', cost: 23.50, threshold: 20 },
      { sku: 'AUTO-002', name: 'Spin-On Heavy Duty Oil Filter', desc: '99% multi-pass efficiency, silicone anti-drainback valve', cat: 6, barcode: '8901234567051', uom: 'EA', cost: 6.50, threshold: 30 },
      { sku: 'AUTO-003', name: 'Ceramic Front Brake Pads Set', desc: 'Ultra-quiet copper-free compound with stainless hardware', cat: 6, barcode: '8901234567052', uom: 'SET', cost: 36.00, threshold: 12 },
      { sku: 'AUTO-004', name: 'All-Season Silicone Wiper Blades 22" (Pair)', desc: 'Aerodynamic beam blade design with water-repellent coating', cat: 6, barcode: '8901234567053', uom: 'PR', cost: 17.50, threshold: 15 },
      { sku: 'AUTO-005', name: 'Automotive AGM Battery 12V 700CCA', desc: 'Maintenance free sealed absorbed glass mat battery', cat: 6, barcode: '8901234567054', uom: 'EA', cost: 92.00, threshold: 6 },
    ];

    for (const p of products) {
      await conn.query(
        'INSERT INTO products (sku, name, description, category_id, barcode, unit_of_measure, unit_cost, reorder_threshold, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [p.sku, p.name, p.desc, p.cat, p.barcode, p.uom, p.cost, p.threshold]
      );
    }
    console.log(`Seeded ${products.length} products.`);

    // 7. Inventory Stock
    // Query created locations
    const [locations] = await conn.query('SELECT id, warehouse_id, label FROM storage_locations') as any[];
    const locMap: Record<number, any[]> = { 1: [], 2: [], 3: [] };
    for (const loc of locations) {
      locMap[loc.warehouse_id]?.push(loc);
    }

    const stockItems = [
      // WH-001
      { prodId: 1, whId: 1, locIdx: 0, onHand: 180, reserved: 15, threshold: 20 },
      { prodId: 2, whId: 1, locIdx: 1, onHand: 240, reserved: 20, threshold: 25 },
      { prodId: 3, whId: 1, locIdx: 2, onHand: 550, reserved: 30, threshold: 50 },
      { prodId: 4, whId: 1, locIdx: 3, onHand: 65, reserved: 5, threshold: 15 },
      { prodId: 5, whId: 1, locIdx: 4, onHand: 85, reserved: 0, threshold: 20 },
      { prodId: 6, whId: 1, locIdx: 5, onHand: 42, reserved: 8, threshold: 15 },
      { prodId: 7, whId: 1, locIdx: 6, onHand: 310, reserved: 25, threshold: 30 },
      { prodId: 8, whId: 1, locIdx: 7, onHand: 12, reserved: 0, threshold: 40 }, // Low stock!
      { prodId: 9, whId: 1, locIdx: 8, onHand: 5, reserved: 0, threshold: 12 },  // Low stock!
      { prodId: 10, whId: 1, locIdx: 9, onHand: 140, reserved: 10, threshold: 25 },
      { prodId: 14, whId: 1, locIdx: 10, onHand: 450, reserved: 40, threshold: 50 },
      { prodId: 15, whId: 1, locIdx: 11, onHand: 4, reserved: 0, threshold: 3 },
      { prodId: 18, whId: 1, locIdx: 12, onHand: 620, reserved: 50, threshold: 50 },
      { prodId: 22, whId: 1, locIdx: 13, onHand: 3, reserved: 0, threshold: 20 }, // Low stock!
      { prodId: 26, whId: 1, locIdx: 14, onHand: 0, reserved: 0, threshold: 6 },  // Out of stock!

      // WH-002
      { prodId: 1, whId: 2, locIdx: 0, onHand: 95, reserved: 10, threshold: 20 },
      { prodId: 3, whId: 2, locIdx: 1, onHand: 320, reserved: 0, threshold: 50 },
      { prodId: 5, whId: 2, locIdx: 2, onHand: 60, reserved: 5, threshold: 20 },
      { prodId: 7, whId: 2, locIdx: 3, onHand: 190, reserved: 15, threshold: 30 },
      { prodId: 11, whId: 2, locIdx: 4, onHand: 110, reserved: 0, threshold: 20 },
      { prodId: 12, whId: 2, locIdx: 5, onHand: 280, reserved: 20, threshold: 35 },
      { prodId: 16, whId: 2, locIdx: 6, onHand: 8, reserved: 0, threshold: 25 }, // Low stock!
      { prodId: 19, whId: 2, locIdx: 7, onHand: 340, reserved: 0, threshold: 40 },
      { prodId: 23, whId: 2, locIdx: 8, onHand: 75, reserved: 10, threshold: 30 },

      // WH-003
      { prodId: 2, whId: 3, locIdx: 0, onHand: 115, reserved: 0, threshold: 25 },
      { prodId: 4, whId: 3, locIdx: 1, onHand: 35, reserved: 5, threshold: 15 },
      { prodId: 6, whId: 3, locIdx: 2, onHand: 48, reserved: 0, threshold: 15 },
      { prodId: 13, whId: 3, locIdx: 3, onHand: 55, reserved: 0, threshold: 15 },
      { prodId: 14, whId: 3, locIdx: 4, onHand: 210, reserved: 20, threshold: 50 },
      { prodId: 17, whId: 3, locIdx: 5, onHand: 95, reserved: 0, threshold: 30 },
      { prodId: 20, whId: 3, locIdx: 6, onHand: 120, reserved: 0, threshold: 20 },
      { prodId: 24, whId: 3, locIdx: 7, onHand: 38, reserved: 0, threshold: 12 },
      { prodId: 25, whId: 3, locIdx: 8, onHand: 0, reserved: 0, threshold: 15 }, // Out of stock!
    ];

    for (const item of stockItems) {
      const locList = locMap[item.whId] || [];
      const location = locList[item.locIdx % locList.length];
      await conn.query(
        'INSERT INTO inventory (product_id, warehouse_id, location_id, quantity_on_hand, reserved_quantity, reorder_threshold, last_counted_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [item.prodId, item.whId, location?.id || null, item.onHand, item.reserved, item.threshold]
      );

      // Record initial inventory movement
      await conn.query(
        'INSERT INTO inventory_movements (product_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [item.prodId, item.whId, location?.id || null, 'receive', item.onHand, 'initial_stock', null, 'Initial baseline inventory intake']
      );
    }
    console.log(`Seeded ${stockItems.length} inventory records with movement history.`);

    // 8. Inbound Receipts
    const receiptsData = [
      {
        num: 'REC-2026-001',
        supId: 1,
        whId: 1,
        status: 'completed',
        expected: '2026-10-10',
        received: '2026-10-10',
        notes: 'Monthly bulk hardware shipment received in full.',
        items: [
          { prodId: 1, exp: 100, rec: 100, locId: locMap[1][0]?.id },
          { prodId: 2, exp: 120, rec: 120, locId: locMap[1][1]?.id },
        ],
      },
      {
        num: 'REC-2026-002',
        supId: 4,
        whId: 1,
        status: 'in_progress',
        expected: '2026-10-18',
        received: '2026-10-19',
        notes: 'Partial delivery at bay 4. Awaiting supervisor signoff.',
        items: [
          { prodId: 14, exp: 200, rec: 150, locId: locMap[1][10]?.id },
          { prodId: 17, exp: 50, rec: 25, locId: locMap[1][11]?.id },
        ],
      },
      {
        num: 'REC-2026-003',
        supId: 3,
        whId: 2,
        status: 'draft',
        expected: '2026-10-25',
        received: null,
        notes: 'Scheduled replenishment for breakroom supplies.',
        items: [
          { prodId: 11, exp: 80, rec: 0, locId: locMap[2][4]?.id },
          { prodId: 12, exp: 100, rec: 0, locId: locMap[2][5]?.id },
        ],
      },
    ];

    for (const r of receiptsData) {
      const [recRes] = await conn.query(
        'INSERT INTO inbound_receipts (receipt_number, supplier_id, warehouse_id, status, expected_date, received_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [r.num, r.supId, r.whId, r.status, r.expected, r.received, r.notes]
      ) as any;
      const receiptId = recRes.insertId;

      for (const item of r.items) {
        await conn.query(
          'INSERT INTO receipt_items (receipt_id, product_id, expected_quantity, received_quantity, location_id) VALUES (?, ?, ?, ?, ?)',
          [receiptId, item.prodId, item.exp, item.rec, item.locId]
        );
      }
    }
    console.log('Seeded inbound receipts and line items.');

    // 9. Orders
    const ordersData = [
      {
        num: 'ORD-2026-1001',
        cust: 'Acme Logistics Corp',
        email: 'procure@acmecorp.com',
        phone: '+1-555-4011',
        addr: '400 Commerce Park, Austin, TX 78701',
        status: 'fulfilled',
        priority: 'normal',
        items: [
          { prodId: 1, qty: 15, fulfilled: 15, price: 34.99, whId: 1 },
          { prodId: 3, qty: 25, fulfilled: 25, price: 12.99, whId: 1 },
        ],
      },
      {
        num: 'ORD-2026-1002',
        cust: 'Apex Regional Medical Center',
        email: 'supplies@apexmedical.org',
        phone: '+1-555-4022',
        addr: '700 Hospital Blvd, Suite 200, Atlanta, GA 30301',
        status: 'processing',
        priority: 'urgent',
        items: [
          { prodId: 14, qty: 30, fulfilled: 0, price: 9.50, whId: 1 },
          { prodId: 2, qty: 10, fulfilled: 0, price: 24.99, whId: 1 },
        ],
      },
      {
        num: 'ORD-2026-1003',
        cust: 'Metro Public School District',
        email: 'orders@metroschools.edu',
        phone: '+1-555-4033',
        addr: '120 Education Way, Portland, OR 97201',
        status: 'confirmed',
        priority: 'high',
        items: [
          { prodId: 18, qty: 20, fulfilled: 0, price: 7.99, whId: 1 },
          { prodId: 4, qty: 5, fulfilled: 0, price: 44.50, whId: 1 },
        ],
      },
      {
        num: 'ORD-2026-1004',
        cust: 'Cascade Engineering Partners',
        email: 'dispatch@cascade-eng.com',
        phone: '+1-555-4044',
        addr: '88 Tech Ridge, Seattle, WA 98101',
        status: 'pending',
        priority: 'normal',
        items: [
          { prodId: 6, qty: 8, fulfilled: 0, price: 59.99, whId: 1 },
        ],
      },
      {
        num: 'ORD-2026-1005',
        cust: 'Western Fleet Maintenance',
        email: 'parts@westernfleet.net',
        phone: '+1-555-4055',
        addr: '500 Auto Mall Way, Phoenix, AZ 85001',
        status: 'cancelled',
        priority: 'low',
        items: [
          { prodId: 23, qty: 10, fulfilled: 0, price: 29.99, whId: 2 },
        ],
      },
    ];

    for (const o of ordersData) {
      const [ordRes] = await conn.query(
        'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, status, priority, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [o.num, o.cust, o.email, o.phone, o.addr, o.status, o.priority]
      ) as any;
      const orderId = ordRes.insertId;

      for (const item of o.items) {
        const [oiRes] = await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity_ordered, quantity_fulfilled, warehouse_id, unit_price) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.prodId, item.qty, item.fulfilled, item.whId, item.price]
        ) as any;
        const orderItemId = oiRes.insertId;

        // If order is confirmed or processing, create active reservations
        if (o.status === 'confirmed' || o.status === 'processing') {
          await conn.query(
            'INSERT INTO stock_reservations (order_id, order_item_id, product_id, warehouse_id, location_id, quantity, status) VALUES (?, ?, ?, ?, ?, ?, "active")',
            [orderId, orderItemId, item.prodId, item.whId, locMap[item.whId][0]?.id || null, item.qty]
          );
        }
      }
    }
    console.log('Seeded orders, order items, and stock reservations.');

    // 10. Shipments
    const shipmentsData = [
      {
        num: 'SHP-2026-9001',
        orderId: 1,
        whId: 1,
        status: 'delivered',
        recipient: 'Acme Logistics Corp',
        address: '400 Commerce Park, Austin, TX 78701',
        carrier: 'FedEx Freight',
        tracking: 'FDX-882947192',
        shipDate: '2026-10-12',
        deliveryDate: '2026-10-14',
        items: [
          { prodId: 1, ordered: 15, picked: 15, packed: 15 },
          { prodId: 3, ordered: 25, picked: 25, packed: 25 },
        ],
      },
      {
        num: 'SHP-2026-9002',
        orderId: 2,
        whId: 1,
        status: 'packed',
        recipient: 'Apex Regional Medical Center',
        address: '700 Hospital Blvd, Suite 200, Atlanta, GA 30301',
        carrier: 'UPS Express',
        tracking: '1Z9999999999999999',
        shipDate: '2026-10-21',
        deliveryDate: '2026-10-22',
        items: [
          { prodId: 14, ordered: 30, picked: 30, packed: 30 },
          { prodId: 2, ordered: 10, picked: 10, packed: 10 },
        ],
      },
      {
        num: 'SHP-2026-9003',
        orderId: 3,
        whId: 1,
        status: 'picking',
        recipient: 'Metro Public School District',
        address: '120 Education Way, Portland, OR 97201',
        carrier: 'USPS Priority',
        tracking: '9400100000000000000000',
        shipDate: '2026-10-22',
        deliveryDate: '2026-10-24',
        items: [
          { prodId: 18, ordered: 20, picked: 12, packed: 0 },
          { prodId: 4, ordered: 5, picked: 5, packed: 0 },
        ],
      },
      {
        num: 'SHP-2026-9004',
        orderId: 4,
        whId: 1,
        status: 'ready_to_pick',
        recipient: 'Cascade Engineering Partners',
        address: '88 Tech Ridge, Seattle, WA 98101',
        carrier: 'DHL Express',
        tracking: null,
        shipDate: '2026-10-23',
        deliveryDate: null,
        items: [
          { prodId: 6, ordered: 8, picked: 0, packed: 0 },
        ],
      },
    ];

    for (const s of shipmentsData) {
      const [shpRes] = await conn.query(
        'INSERT INTO shipments (shipment_number, order_id, warehouse_id, status, recipient_name, shipping_address, carrier, tracking_number, expected_ship_date, expected_delivery_date, actual_ship_date, actual_delivery_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [
          s.num,
          s.orderId,
          s.whId,
          s.status,
          s.recipient,
          s.address,
          s.carrier,
          s.tracking,
          s.shipDate,
          s.deliveryDate,
          s.status === 'delivered' ? '2026-10-12 14:00:00' : null,
          s.status === 'delivered' ? '2026-10-14 10:30:00' : null,
        ]
      ) as any;
      const shipmentId = shpRes.insertId;

      for (const item of s.items) {
        await conn.query(
          'INSERT INTO shipment_items (shipment_id, product_id, quantity_ordered, quantity_picked, quantity_packed, location_id) VALUES (?, ?, ?, ?, ?, ?)',
          [shipmentId, item.prodId, item.ordered, item.picked, item.packed, locMap[s.whId][0]?.id || null]
        );
      }

      await conn.query(
        'INSERT INTO shipment_status_events (shipment_id, status, notes, created_by) VALUES (?, ?, ?, 1)',
        [shipmentId, s.status, `Shipment status updated to ${s.status}`]
      );
    }
    console.log('Seeded shipments, shipment items, and status events.');

    // 11. Initial Audit Log
    const auditEvents = [
      { action: 'LOGIN', type: 'user', id: 1, details: { user: 'admin', ip: '127.0.0.1' } },
      { action: 'STOCK_ADJUSTMENT', type: 'inventory', id: 1, details: { sku: 'ELEC-001', change: '+20', reason: 'Cycle count verification' } },
      { action: 'RECEIPT_COMPLETE', type: 'receipt', id: 1, details: { receiptNumber: 'REC-2026-001', itemsCount: 2 } },
      { action: 'SHIPMENT_DISPATCHED', type: 'shipment', id: 1, details: { shipmentNumber: 'SHP-2026-9001', carrier: 'FedEx' } },
    ];

    for (const a of auditEvents) {
      await conn.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, "127.0.0.1")',
        [a.id, a.action, a.type, a.id, JSON.stringify(a.details)]
      );
    }
    console.log('Seeded audit log entries.');
  });

  console.log('Database seeding completed successfully.');
}

// Run directly if called as a script
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
