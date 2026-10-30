-- Warehouse Stock & Shipment Management System Database Schema (MySQL 8.0+)

-- Disable foreign key checks for clean teardown/setup
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inventory_transfers;
DROP TABLE IF EXISTS stock_adjustments;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS shipment_status_events;
DROP TABLE IF EXISTS shipment_items;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS receipt_items;
DROP TABLE IF EXISTS inbound_receipts;
DROP TABLE IF EXISTS stock_reservations;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS storage_locations;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;

SET FOREIGN_KEY_CHECKS = 1;

-- Sessions Table for express-session or token lookup
CREATE TABLE sessions (
  sid VARCHAR(128) PRIMARY KEY,
  sess JSON NOT NULL,
  expired BIGINT NOT NULL,
  INDEX idx_sessions_expired (expired)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users and roles
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin','manager','staff','viewer') NOT NULL DEFAULT 'staff',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warehouses
CREATE TABLE warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  capacity INT DEFAULT 10000,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warehouses_code (code),
  INDEX idx_warehouses_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Storage locations (hierarchical: zone > aisle > rack > bin)
CREATE TABLE storage_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  zone VARCHAR(50),
  aisle VARCHAR(50),
  rack VARCHAR(50),
  bin VARCHAR(50),
  label VARCHAR(100) NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_storage_location (warehouse_id, label),
  INDEX idx_locations_wh (warehouse_id),
  CONSTRAINT fk_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers
CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(191),
  phone VARCHAR(50),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  barcode VARCHAR(100) UNIQUE,
  unit_of_measure VARCHAR(20) DEFAULT 'EA',
  unit_cost DECIMAL(10,2) DEFAULT 0.00,
  reorder_threshold INT DEFAULT 10,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_sku (sku),
  INDEX idx_products_barcode (barcode),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory (stock levels per product per warehouse per location)
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  location_id INT,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  reorder_threshold INT DEFAULT 10,
  last_counted_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory_item (product_id, warehouse_id, location_id),
  INDEX idx_inv_product (product_id),
  INDEX idx_inv_warehouse (warehouse_id),
  INDEX idx_inv_location (location_id),
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_location FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory movements (audit trail of all physical quantity shifts)
CREATE TABLE inventory_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  location_id INT,
  movement_type ENUM('receive','ship','adjust','transfer_in','transfer_out','reserve','release') NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  reason TEXT,
  performed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_prod (product_id),
  INDEX idx_mov_wh (warehouse_id),
  INDEX idx_mov_type (movement_type),
  INDEX idx_mov_date (created_at),
  CONSTRAINT fk_mov_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_location FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(191),
  customer_phone VARCHAR(50),
  shipping_address TEXT,
  status ENUM('pending','confirmed','processing','partially_fulfilled','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
  notes TEXT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  INDEX idx_orders_priority (priority),
  INDEX idx_orders_date (order_date),
  CONSTRAINT fk_orders_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity_ordered INT NOT NULL,
  quantity_fulfilled INT NOT NULL DEFAULT 0,
  warehouse_id INT,
  unit_price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock reservations (allocates available inventory to orders before pick/ship)
CREATE TABLE stock_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  order_item_id INT NOT NULL,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  location_id INT,
  quantity INT NOT NULL,
  status ENUM('active','fulfilled','released') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_res_order (order_id),
  INDEX idx_res_product (product_id),
  INDEX idx_res_status (status),
  CONSTRAINT fk_res_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_location FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inbound receipts (Vendor Purchase Orders / ASNs)
CREATE TABLE inbound_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id INT,
  warehouse_id INT NOT NULL,
  status ENUM('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_receipts_status (status),
  INDEX idx_receipts_wh (warehouse_id),
  CONSTRAINT fk_receipts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CONSTRAINT fk_receipts_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_receipts_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipt items
CREATE TABLE receipt_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_id INT NOT NULL,
  product_id INT NOT NULL,
  expected_quantity INT NOT NULL DEFAULT 0,
  received_quantity INT NOT NULL DEFAULT 0,
  damaged_quantity INT NOT NULL DEFAULT 0,
  location_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ri_receipt (receipt_id),
  INDEX idx_ri_product (product_id),
  CONSTRAINT fk_ri_receipt FOREIGN KEY (receipt_id) REFERENCES inbound_receipts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ri_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_ri_location FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipments
CREATE TABLE shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_number VARCHAR(100) UNIQUE NOT NULL,
  order_id INT,
  warehouse_id INT NOT NULL,
  status ENUM('draft','ready_to_pick','picking','packed','dispatched','delivered','cancelled') NOT NULL DEFAULT 'draft',
  recipient_name VARCHAR(255),
  shipping_address TEXT,
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  expected_ship_date DATE,
  expected_delivery_date DATE,
  actual_ship_date TIMESTAMP NULL DEFAULT NULL,
  actual_delivery_date TIMESTAMP NULL DEFAULT NULL,
  notes TEXT,
  assigned_to INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shipments_status (status),
  INDEX idx_shipments_order (order_id),
  INDEX idx_shipments_wh (warehouse_id),
  INDEX idx_shipments_tracking (tracking_number),
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_shipments_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_shipments_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_shipments_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipment items
CREATE TABLE shipment_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity_ordered INT NOT NULL,
  quantity_picked INT NOT NULL DEFAULT 0,
  quantity_packed INT NOT NULL DEFAULT 0,
  location_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_si_shipment (shipment_id),
  INDEX idx_si_product (product_id),
  CONSTRAINT fk_si_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_location FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipment status history
CREATE TABLE shipment_status_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sse_shipment (shipment_id),
  CONSTRAINT fk_sse_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  CONSTRAINT fk_sse_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT,
  details JSON,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock adjustments
CREATE TABLE stock_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  location_id INT,
  adjustment_type ENUM('count','damage','loss','found','correction') NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  reason TEXT NOT NULL,
  performed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sa_product (product_id),
  INDEX idx_sa_wh (warehouse_id),
  CONSTRAINT fk_sa_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_loc FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_sa_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory transfers
CREATE TABLE inventory_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  from_warehouse_id INT NOT NULL,
  from_location_id INT,
  to_warehouse_id INT NOT NULL,
  to_location_id INT,
  quantity INT NOT NULL,
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT,
  performed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_it_product (product_id),
  INDEX idx_it_status (status),
  CONSTRAINT fk_it_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_it_from_wh FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_it_to_wh FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_it_from_loc FOREIGN KEY (from_location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_it_to_loc FOREIGN KEY (to_location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_it_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
