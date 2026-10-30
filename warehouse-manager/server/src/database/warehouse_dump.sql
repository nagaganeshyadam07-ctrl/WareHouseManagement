-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: localhost    Database: warehouse_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `warehouse_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `warehouse_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `warehouse_db`;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,1,'LOGIN','user',1,'{\"ip\": \"127.0.0.1\", \"user\": \"admin\"}','127.0.0.1','2026-10-21 13:06:38'),(2,1,'STOCK_ADJUSTMENT','inventory',1,'{\"sku\": \"ELEC-001\", \"change\": \"+20\", \"reason\": \"Cycle count verification\"}','127.0.0.1','2026-10-21 13:06:38'),(3,1,'RECEIPT_COMPLETE','receipt',1,'{\"itemsCount\": 2, \"receiptNumber\": \"REC-2026-001\"}','127.0.0.1','2026-10-21 13:06:38'),(4,1,'SHIPMENT_DISPATCHED','shipment',1,'{\"carrier\": \"FedEx\", \"shipmentNumber\": \"SHP-2026-9001\"}','127.0.0.1','2026-10-21 13:06:38'),(5,1,'LOGIN','user',1,'{\"username\": \"admin\"}','::1','2026-10-24 04:49:01'),(6,1,'LOGIN','user',1,'{\"username\": \"admin\"}','::1','2026-10-29 02:54:48'),(7,2,'LOGIN','user',2,'{\"username\": \"manager\"}','::1','2026-10-29 03:01:29'),(8,2,'LOGIN','user',2,'{\"username\": \"manager\"}','::1','2026-10-29 03:02:43');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Electronics','Consumer and industrial electronics, cables, and accessories','2026-10-21 13:06:38'),(2,'Clothing','Apparel, footwear, and textile products','2026-10-21 13:06:38'),(3,'Food & Beverage','Packaged food items, snacks, and drinks','2026-10-21 13:06:38'),(4,'Industrial','Safety equipment, tools, and industrial supplies','2026-10-21 13:06:38'),(5,'Office Supplies','Paper, pens, folders, and office equipment','2026-10-21 13:06:38'),(6,'Automotive','Vehicle parts, accessories, and maintenance products','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbound_receipts`
--

DROP TABLE IF EXISTS `inbound_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbound_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `warehouse_id` int NOT NULL,
  `status` enum('draft','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `expected_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_receipts_status` (`status`),
  KEY `idx_receipts_wh` (`warehouse_id`),
  KEY `fk_receipts_supplier` (`supplier_id`),
  KEY `fk_receipts_user` (`created_by`),
  CONSTRAINT `fk_receipts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_receipts_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_receipts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbound_receipts`
--

LOCK TABLES `inbound_receipts` WRITE;
/*!40000 ALTER TABLE `inbound_receipts` DISABLE KEYS */;
INSERT INTO `inbound_receipts` VALUES (1,'REC-2026-001',1,1,'completed','2026-10-10','2026-10-10','Monthly bulk hardware shipment received in full.',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'REC-2026-002',4,1,'in_progress','2026-10-18','2026-10-19','Partial delivery at bay 4. Awaiting supervisor signoff.',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'REC-2026-003',3,2,'draft','2026-10-25',NULL,'Scheduled replenishment for breakroom supplies.',1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `inbound_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `quantity_on_hand` int NOT NULL DEFAULT '0',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `reorder_threshold` int DEFAULT '10',
  `last_counted_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_item` (`product_id`,`warehouse_id`,`location_id`),
  KEY `idx_inv_product` (`product_id`),
  KEY `idx_inv_warehouse` (`warehouse_id`),
  KEY `idx_inv_location` (`location_id`),
  CONSTRAINT `fk_inv_location` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,1,1,180,15,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,2,1,2,240,20,25,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,3,1,3,550,30,50,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,4,1,4,65,5,15,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(5,5,1,5,85,0,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(6,6,1,6,42,8,15,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(7,7,1,7,310,25,30,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(8,8,1,8,12,0,40,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(9,9,1,9,5,0,12,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(10,10,1,10,140,10,25,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(11,14,1,11,450,40,50,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(12,15,1,12,4,0,3,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(13,18,1,13,620,50,50,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(14,22,1,14,3,0,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(15,26,1,15,0,0,6,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(16,1,2,73,95,10,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(17,3,2,74,320,0,50,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(18,5,2,75,60,5,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(19,7,2,76,190,15,30,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(20,11,2,77,110,0,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(21,12,2,78,280,20,35,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(22,16,2,79,8,0,25,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(23,19,2,80,340,0,40,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(24,23,2,81,75,10,30,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(25,2,3,127,115,0,25,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(26,4,3,128,35,5,15,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(27,6,3,129,48,0,15,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(28,13,3,130,55,0,15,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(29,14,3,131,210,20,50,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(30,17,3,132,95,0,30,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(31,20,3,133,120,0,20,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(32,24,3,134,38,0,12,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(33,25,3,135,0,0,15,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_movements`
--

DROP TABLE IF EXISTS `inventory_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `movement_type` enum('receive','ship','adjust','transfer_in','transfer_out','reserve','release') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `performed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mov_prod` (`product_id`),
  KEY `idx_mov_wh` (`warehouse_id`),
  KEY `idx_mov_type` (`movement_type`),
  KEY `idx_mov_date` (`created_at`),
  KEY `fk_mov_location` (`location_id`),
  KEY `fk_mov_user` (`performed_by`),
  CONSTRAINT `fk_mov_location` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mov_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_movements`
--

LOCK TABLES `inventory_movements` WRITE;
/*!40000 ALTER TABLE `inventory_movements` DISABLE KEYS */;
INSERT INTO `inventory_movements` VALUES (1,1,1,1,'receive',180,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(2,2,1,2,'receive',240,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(3,3,1,3,'receive',550,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(4,4,1,4,'receive',65,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(5,5,1,5,'receive',85,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(6,6,1,6,'receive',42,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(7,7,1,7,'receive',310,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(8,8,1,8,'receive',12,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(9,9,1,9,'receive',5,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(10,10,1,10,'receive',140,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(11,14,1,11,'receive',450,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(12,15,1,12,'receive',4,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(13,18,1,13,'receive',620,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(14,22,1,14,'receive',3,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(15,26,1,15,'receive',0,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(16,1,2,73,'receive',95,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(17,3,2,74,'receive',320,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(18,5,2,75,'receive',60,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(19,7,2,76,'receive',190,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(20,11,2,77,'receive',110,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(21,12,2,78,'receive',280,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(22,16,2,79,'receive',8,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(23,19,2,80,'receive',340,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(24,23,2,81,'receive',75,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(25,2,3,127,'receive',115,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(26,4,3,128,'receive',35,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(27,6,3,129,'receive',48,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(28,13,3,130,'receive',55,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(29,14,3,131,'receive',210,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(30,17,3,132,'receive',95,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(31,20,3,133,'receive',120,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(32,24,3,134,'receive',38,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38'),(33,25,3,135,'receive',0,'initial_stock',NULL,'Initial baseline inventory intake',1,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `inventory_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transfers`
--

DROP TABLE IF EXISTS `inventory_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `from_warehouse_id` int NOT NULL,
  `from_location_id` int DEFAULT NULL,
  `to_warehouse_id` int NOT NULL,
  `to_location_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `status` enum('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `performed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_it_product` (`product_id`),
  KEY `idx_it_status` (`status`),
  KEY `fk_it_from_wh` (`from_warehouse_id`),
  KEY `fk_it_to_wh` (`to_warehouse_id`),
  KEY `fk_it_from_loc` (`from_location_id`),
  KEY `fk_it_to_loc` (`to_location_id`),
  KEY `fk_it_user` (`performed_by`),
  CONSTRAINT `fk_it_from_loc` FOREIGN KEY (`from_location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_from_wh` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_to_loc` FOREIGN KEY (`to_location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_to_wh` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transfers`
--

LOCK TABLES `inventory_transfers` WRITE;
/*!40000 ALTER TABLE `inventory_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity_ordered` int NOT NULL,
  `quantity_fulfilled` int NOT NULL DEFAULT '0',
  `warehouse_id` int DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  KEY `fk_oi_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,15,15,1,34.99,'2026-10-21 13:06:38'),(2,1,3,25,25,1,12.99,'2026-10-21 13:06:38'),(3,2,14,30,0,1,9.50,'2026-10-21 13:06:38'),(4,2,2,10,0,1,24.99,'2026-10-21 13:06:38'),(5,3,18,20,0,1,7.99,'2026-10-21 13:06:38'),(6,3,4,5,0,1,44.50,'2026-10-21 13:06:38'),(7,4,6,8,0,1,59.99,'2026-10-21 13:06:38'),(8,5,23,10,0,2,29.99,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','confirmed','processing','partially_fulfilled','fulfilled','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_priority` (`priority`),
  KEY `idx_orders_date` (`order_date`),
  KEY `fk_orders_user` (`created_by`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD-2026-1001','Acme Logistics Corp','procure@acmecorp.com','+1-555-4011','400 Commerce Park, Austin, TX 78701','fulfilled','normal',NULL,'2026-10-21 13:06:38',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'ORD-2026-1002','Apex Regional Medical Center','supplies@apexmedical.org','+1-555-4022','700 Hospital Blvd, Suite 200, Atlanta, GA 30301','processing','urgent',NULL,'2026-10-21 13:06:38',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'ORD-2026-1003','Metro Public School District','orders@metroschools.edu','+1-555-4033','120 Education Way, Portland, OR 97201','confirmed','high',NULL,'2026-10-21 13:06:38',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,'ORD-2026-1004','Cascade Engineering Partners','dispatch@cascade-eng.com','+1-555-4044','88 Tech Ridge, Seattle, WA 98101','pending','normal',NULL,'2026-10-21 13:06:38',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(5,'ORD-2026-1005','Western Fleet Maintenance','parts@westernfleet.net','+1-555-4055','500 Auto Mall Way, Phoenix, AZ 85001','cancelled','low',NULL,'2026-10-21 13:06:38',1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int DEFAULT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_of_measure` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'EA',
  `unit_cost` decimal(10,2) DEFAULT '0.00',
  `reorder_threshold` int DEFAULT '10',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_sku` (`sku`),
  KEY `idx_products_barcode` (`barcode`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'ELEC-001','USB-C Multiport Hub 7-in-1','4K HDMI, 3x USB-A 3.0, 100W PD, SD card slot',1,'8901234567001','EA',24.50,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'ELEC-002','Ergonomic Vertical Wireless Mouse','2.4GHz + Bluetooth dual mode, 4000 DPI sensor',1,'8901234567002','EA',18.25,25,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'ELEC-003','Ultra High-Speed HDMI 2.1 Cable (2m)','Braided jacket, 48Gbps 8K@60Hz / 4K@120Hz',1,'8901234567003','EA',8.90,50,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,'ELEC-004','Aluminum Laptop Riser Stand','Foldable ergonomic stand with cooling vents',1,'8901234567004','EA',32.00,15,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(5,'ELEC-005','Rugged Waterproof Bluetooth Speaker','IP67 waterproof, 16W stereo driver, 14hr battery',1,'8901234567005','EA',29.95,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(6,'ELEC-006','1080p 60FPS Streaming Webcam','Dual noise-cancelling mics, autofocus, privacy cover',1,'8901234567006','EA',42.00,15,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(7,'CLTH-001','Industrial Work Polo Shirt Navy (L)','Breathable moisture-wicking heavy duty polyester-cotton',2,'8901234567010','EA',14.50,30,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(8,'CLTH-002','High-Visibility Class 2 Safety Vest (XL)','Reflective silver strips, zipper front, 4 pockets',2,'8901234567011','EA',8.50,40,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(9,'CLTH-003','Steel-Toe Waterproof Work Boots (Size 10)','Full-grain leather, puncture resistant steel plate',2,'8901234567012','PR',68.00,12,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(10,'CLTH-004','Impact & Cut Resistant Work Gloves (M)','ANSI Cut Level A4, nitrile coated palm, touchscreen ready',2,'8901234567013','PR',12.50,25,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(11,'FOOD-001','Organic Granola Bar Variety Pack (48ct)','Assorted almond, peanut butter, and dark chocolate bars',3,'8901234567020','CS',22.50,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(12,'FOOD-002','Natural Spring Water 500ml (24-Pack)','Recycled PET bottles, balanced mineral water',3,'8901234567021','CS',6.75,35,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(13,'FOOD-003','Artisan Roast Instant Coffee (100-Pack)','Single serve medium roast 100% Arabica packets',3,'8901234567022','BX',27.90,15,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(14,'INDL-001','Anti-Fog Industrial Safety Goggles','ANSI Z87.1 certified, UV400 protection, vented frame',4,'8901234567030','EA',7.20,50,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(15,'INDL-002','Heavy-Duty Pallet Jack 5,500 lbs','Polyurethane wheels, 48-inch forks, reinforced steel frame',4,'8901234567031','EA',295.00,3,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(16,'INDL-003','Cast Stretch Shrink Wrap 18\" x 1500ft','80 gauge thickness, high tensile clarity wrap',4,'8901234567032','RL',15.80,25,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(17,'INDL-004','Commercial Packing Tape 3\" (6-Pack)','Heavy-duty acrylic adhesive, 110 yards per roll',4,'8901234567033','PK',11.20,30,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(18,'INDL-005','OSHA Compliant Ventilated Hard Hat (White)','Ratchet suspension, accessory slots, sweatband',4,'8901234567034','EA',13.50,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(19,'OFFC-001','Multipurpose Copy Paper 500 Sheets 20lb','Acid-free bright white 92 brightness 8.5x11',5,'8901234567040','RM',5.25,50,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(20,'OFFC-002','Retractable Ballpoint Pens 1.0mm (12pk)','Smear-proof black ink, rubber comfort grip',5,'8901234567041','PK',3.80,40,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(21,'OFFC-003','Heavyweight Manila File Folders (100pk)','1/3-cut tabs, letter size, durable paper stock',5,'8901234567042','BX',14.50,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(22,'OFFC-004','Low Odor Chisel Dry Erase Markers (8pk)','Vibrant quick-drying colors, easily erases',5,'8901234567043','PK',6.80,25,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(23,'AUTO-001','Full Synthetic Motor Oil 5W-30 (5-Quart)','Advanced wear protection, dexos1 Gen3 approved',6,'8901234567050','EA',23.50,20,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(24,'AUTO-002','Spin-On Heavy Duty Oil Filter','99% multi-pass efficiency, silicone anti-drainback valve',6,'8901234567051','EA',6.50,30,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(25,'AUTO-003','Ceramic Front Brake Pads Set','Ultra-quiet copper-free compound with stainless hardware',6,'8901234567052','SET',36.00,12,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(26,'AUTO-004','All-Season Silicone Wiper Blades 22\" (Pair)','Aerodynamic beam blade design with water-repellent coating',6,'8901234567053','PR',17.50,15,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(27,'AUTO-005','Automotive AGM Battery 12V 700CCA','Maintenance free sealed absorbed glass mat battery',6,'8901234567054','EA',92.00,6,1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt_items`
--

DROP TABLE IF EXISTS `receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_id` int NOT NULL,
  `product_id` int NOT NULL,
  `expected_quantity` int NOT NULL DEFAULT '0',
  `received_quantity` int NOT NULL DEFAULT '0',
  `damaged_quantity` int NOT NULL DEFAULT '0',
  `location_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ri_receipt` (`receipt_id`),
  KEY `idx_ri_product` (`product_id`),
  KEY `fk_ri_location` (`location_id`),
  CONSTRAINT `fk_ri_location` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ri_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `inbound_receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_items`
--

LOCK TABLES `receipt_items` WRITE;
/*!40000 ALTER TABLE `receipt_items` DISABLE KEYS */;
INSERT INTO `receipt_items` VALUES (1,1,1,100,100,0,1,NULL,'2026-10-21 13:06:38'),(2,1,2,120,120,0,2,NULL,'2026-10-21 13:06:38'),(3,2,14,200,150,0,11,NULL,'2026-10-21 13:06:38'),(4,2,17,50,25,0,12,NULL,'2026-10-21 13:06:38'),(5,3,11,80,0,0,77,NULL,'2026-10-21 13:06:38'),(6,3,12,100,0,0,78,NULL,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `sid` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sess` json NOT NULL,
  `expired` bigint NOT NULL,
  PRIMARY KEY (`sid`),
  KEY `idx_sessions_expired` (`expired`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_items`
--

DROP TABLE IF EXISTS `shipment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity_ordered` int NOT NULL,
  `quantity_picked` int NOT NULL DEFAULT '0',
  `quantity_packed` int NOT NULL DEFAULT '0',
  `location_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_si_shipment` (`shipment_id`),
  KEY `idx_si_product` (`product_id`),
  KEY `fk_si_location` (`location_id`),
  CONSTRAINT `fk_si_location` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_si_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_items`
--

LOCK TABLES `shipment_items` WRITE;
/*!40000 ALTER TABLE `shipment_items` DISABLE KEYS */;
INSERT INTO `shipment_items` VALUES (1,1,1,15,15,15,1,'2026-10-21 13:06:38'),(2,1,3,25,25,25,1,'2026-10-21 13:06:38'),(3,2,14,30,30,30,1,'2026-10-21 13:06:38'),(4,2,2,10,10,10,1,'2026-10-21 13:06:38'),(5,3,18,20,12,0,1,'2026-10-21 13:06:38'),(6,3,4,5,5,0,1,'2026-10-21 13:06:38'),(7,4,6,8,0,0,1,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `shipment_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_status_events`
--

DROP TABLE IF EXISTS `shipment_status_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment_status_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sse_shipment` (`shipment_id`),
  KEY `fk_sse_user` (`created_by`),
  CONSTRAINT `fk_sse_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sse_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_status_events`
--

LOCK TABLES `shipment_status_events` WRITE;
/*!40000 ALTER TABLE `shipment_status_events` DISABLE KEYS */;
INSERT INTO `shipment_status_events` VALUES (1,1,'delivered','Shipment status updated to delivered',1,'2026-10-21 13:06:38'),(2,2,'packed','Shipment status updated to packed',1,'2026-10-21 13:06:38'),(3,3,'picking','Shipment status updated to picking',1,'2026-10-21 13:06:38'),(4,4,'ready_to_pick','Shipment status updated to ready_to_pick',1,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `shipment_status_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int DEFAULT NULL,
  `warehouse_id` int NOT NULL,
  `status` enum('draft','ready_to_pick','picking','packed','dispatched','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci,
  `carrier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_ship_date` date DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `actual_ship_date` timestamp NULL DEFAULT NULL,
  `actual_delivery_date` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipment_number` (`shipment_number`),
  KEY `idx_shipments_status` (`status`),
  KEY `idx_shipments_order` (`order_id`),
  KEY `idx_shipments_wh` (`warehouse_id`),
  KEY `idx_shipments_tracking` (`tracking_number`),
  KEY `fk_shipments_assignee` (`assigned_to`),
  KEY `fk_shipments_creator` (`created_by`),
  CONSTRAINT `fk_shipments_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shipments_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shipments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shipments_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (1,'SHP-2026-9001',1,1,'delivered','Acme Logistics Corp','400 Commerce Park, Austin, TX 78701','FedEx Freight','FDX-882947192','2026-10-12','2026-10-14','2026-10-12 08:30:00','2026-10-14 05:00:00',NULL,NULL,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'SHP-2026-9002',2,1,'packed','Apex Regional Medical Center','700 Hospital Blvd, Suite 200, Atlanta, GA 30301','UPS Express','1Z9999999999999999','2026-10-21','2026-10-22',NULL,NULL,NULL,NULL,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'SHP-2026-9003',3,1,'picking','Metro Public School District','120 Education Way, Portland, OR 97201','USPS Priority','9400100000000000000000','2026-10-22','2026-10-24',NULL,NULL,NULL,NULL,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,'SHP-2026-9004',4,1,'ready_to_pick','Cascade Engineering Partners','88 Tech Ridge, Seattle, WA 98101','DHL Express',NULL,'2026-10-23',NULL,NULL,NULL,NULL,NULL,1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `adjustment_type` enum('count','damage','loss','found','correction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_before` int NOT NULL,
  `quantity_after` int NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sa_product` (`product_id`),
  KEY `idx_sa_wh` (`warehouse_id`),
  KEY `fk_sa_loc` (`location_id`),
  KEY `fk_sa_user` (`performed_by`),
  CONSTRAINT `fk_sa_loc` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sa_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sa_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sa_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_adjustments`
--

LOCK TABLES `stock_adjustments` WRITE;
/*!40000 ALTER TABLE `stock_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_reservations`
--

DROP TABLE IF EXISTS `stock_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `order_item_id` int NOT NULL,
  `product_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `status` enum('active','fulfilled','released') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `released_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_res_order` (`order_id`),
  KEY `idx_res_product` (`product_id`),
  KEY `idx_res_status` (`status`),
  KEY `fk_res_item` (`order_item_id`),
  KEY `fk_res_warehouse` (`warehouse_id`),
  KEY `fk_res_location` (`location_id`),
  CONSTRAINT `fk_res_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_location` FOREIGN KEY (`location_id`) REFERENCES `storage_locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_res_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_reservations`
--

LOCK TABLES `stock_reservations` WRITE;
/*!40000 ALTER TABLE `stock_reservations` DISABLE KEYS */;
INSERT INTO `stock_reservations` VALUES (1,2,3,14,1,1,30,'active','2026-10-21 13:06:38',NULL),(2,2,4,2,1,1,10,'active','2026-10-21 13:06:38',NULL),(3,3,5,18,1,1,20,'active','2026-10-21 13:06:38',NULL),(4,3,6,4,1,1,5,'active','2026-10-21 13:06:38',NULL);
/*!40000 ALTER TABLE `stock_reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_locations`
--

DROP TABLE IF EXISTS `storage_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL,
  `zone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aisle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rack` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_storage_location` (`warehouse_id`,`label`),
  KEY `idx_locations_wh` (`warehouse_id`),
  CONSTRAINT `fk_locations_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_locations`
--

LOCK TABLES `storage_locations` WRITE;
/*!40000 ALTER TABLE `storage_locations` DISABLE KEYS */;
INSERT INTO `storage_locations` VALUES (1,1,'Zone A - Inbound','A','01','01','Zone-A-A01-01',1,'2026-10-21 13:06:38'),(2,1,'Zone A - Inbound','A','01','02','Zone-A-A01-02',1,'2026-10-21 13:06:38'),(3,1,'Zone A - Inbound','A','02','01','Zone-A-A02-01',1,'2026-10-21 13:06:38'),(4,1,'Zone A - Inbound','A','02','02','Zone-A-A02-02',1,'2026-10-21 13:06:38'),(5,1,'Zone A - Inbound','A','03','01','Zone-A-A03-01',1,'2026-10-21 13:06:38'),(6,1,'Zone A - Inbound','A','03','02','Zone-A-A03-02',1,'2026-10-21 13:06:38'),(7,1,'Zone A - Inbound','B','01','01','Zone-A-B01-01',1,'2026-10-21 13:06:38'),(8,1,'Zone A - Inbound','B','01','02','Zone-A-B01-02',1,'2026-10-21 13:06:38'),(9,1,'Zone A - Inbound','B','02','01','Zone-A-B02-01',1,'2026-10-21 13:06:38'),(10,1,'Zone A - Inbound','B','02','02','Zone-A-B02-02',1,'2026-10-21 13:06:38'),(11,1,'Zone A - Inbound','B','03','01','Zone-A-B03-01',1,'2026-10-21 13:06:38'),(12,1,'Zone A - Inbound','B','03','02','Zone-A-B03-02',1,'2026-10-21 13:06:38'),(13,1,'Zone A - Inbound','C','01','01','Zone-A-C01-01',1,'2026-10-21 13:06:38'),(14,1,'Zone A - Inbound','C','01','02','Zone-A-C01-02',1,'2026-10-21 13:06:38'),(15,1,'Zone A - Inbound','C','02','01','Zone-A-C02-01',1,'2026-10-21 13:06:38'),(16,1,'Zone A - Inbound','C','02','02','Zone-A-C02-02',1,'2026-10-21 13:06:38'),(17,1,'Zone A - Inbound','C','03','01','Zone-A-C03-01',1,'2026-10-21 13:06:38'),(18,1,'Zone A - Inbound','C','03','02','Zone-A-C03-02',1,'2026-10-21 13:06:38'),(19,1,'Zone B - High Density','A','01','01','Zone-B-A01-01',1,'2026-10-21 13:06:38'),(20,1,'Zone B - High Density','A','01','02','Zone-B-A01-02',1,'2026-10-21 13:06:38'),(21,1,'Zone B - High Density','A','02','01','Zone-B-A02-01',1,'2026-10-21 13:06:38'),(22,1,'Zone B - High Density','A','02','02','Zone-B-A02-02',1,'2026-10-21 13:06:38'),(23,1,'Zone B - High Density','A','03','01','Zone-B-A03-01',1,'2026-10-21 13:06:38'),(24,1,'Zone B - High Density','A','03','02','Zone-B-A03-02',1,'2026-10-21 13:06:38'),(25,1,'Zone B - High Density','B','01','01','Zone-B-B01-01',1,'2026-10-21 13:06:38'),(26,1,'Zone B - High Density','B','01','02','Zone-B-B01-02',1,'2026-10-21 13:06:38'),(27,1,'Zone B - High Density','B','02','01','Zone-B-B02-01',1,'2026-10-21 13:06:38'),(28,1,'Zone B - High Density','B','02','02','Zone-B-B02-02',1,'2026-10-21 13:06:38'),(29,1,'Zone B - High Density','B','03','01','Zone-B-B03-01',1,'2026-10-21 13:06:38'),(30,1,'Zone B - High Density','B','03','02','Zone-B-B03-02',1,'2026-10-21 13:06:38'),(31,1,'Zone B - High Density','C','01','01','Zone-B-C01-01',1,'2026-10-21 13:06:38'),(32,1,'Zone B - High Density','C','01','02','Zone-B-C01-02',1,'2026-10-21 13:06:38'),(33,1,'Zone B - High Density','C','02','01','Zone-B-C02-01',1,'2026-10-21 13:06:38'),(34,1,'Zone B - High Density','C','02','02','Zone-B-C02-02',1,'2026-10-21 13:06:38'),(35,1,'Zone B - High Density','C','03','01','Zone-B-C03-01',1,'2026-10-21 13:06:38'),(36,1,'Zone B - High Density','C','03','02','Zone-B-C03-02',1,'2026-10-21 13:06:38'),(37,1,'Zone C - Electronics','A','01','01','Zone-C-A01-01',1,'2026-10-21 13:06:38'),(38,1,'Zone C - Electronics','A','01','02','Zone-C-A01-02',1,'2026-10-21 13:06:38'),(39,1,'Zone C - Electronics','A','02','01','Zone-C-A02-01',1,'2026-10-21 13:06:38'),(40,1,'Zone C - Electronics','A','02','02','Zone-C-A02-02',1,'2026-10-21 13:06:38'),(41,1,'Zone C - Electronics','A','03','01','Zone-C-A03-01',1,'2026-10-21 13:06:38'),(42,1,'Zone C - Electronics','A','03','02','Zone-C-A03-02',1,'2026-10-21 13:06:38'),(43,1,'Zone C - Electronics','B','01','01','Zone-C-B01-01',1,'2026-10-21 13:06:38'),(44,1,'Zone C - Electronics','B','01','02','Zone-C-B01-02',1,'2026-10-21 13:06:38'),(45,1,'Zone C - Electronics','B','02','01','Zone-C-B02-01',1,'2026-10-21 13:06:38'),(46,1,'Zone C - Electronics','B','02','02','Zone-C-B02-02',1,'2026-10-21 13:06:38'),(47,1,'Zone C - Electronics','B','03','01','Zone-C-B03-01',1,'2026-10-21 13:06:38'),(48,1,'Zone C - Electronics','B','03','02','Zone-C-B03-02',1,'2026-10-21 13:06:38'),(49,1,'Zone C - Electronics','C','01','01','Zone-C-C01-01',1,'2026-10-21 13:06:38'),(50,1,'Zone C - Electronics','C','01','02','Zone-C-C01-02',1,'2026-10-21 13:06:38'),(51,1,'Zone C - Electronics','C','02','01','Zone-C-C02-01',1,'2026-10-21 13:06:38'),(52,1,'Zone C - Electronics','C','02','02','Zone-C-C02-02',1,'2026-10-21 13:06:38'),(53,1,'Zone C - Electronics','C','03','01','Zone-C-C03-01',1,'2026-10-21 13:06:38'),(54,1,'Zone C - Electronics','C','03','02','Zone-C-C03-02',1,'2026-10-21 13:06:38'),(55,1,'Zone D - Bulk Storage','A','01','01','Zone-D-A01-01',1,'2026-10-21 13:06:38'),(56,1,'Zone D - Bulk Storage','A','01','02','Zone-D-A01-02',1,'2026-10-21 13:06:38'),(57,1,'Zone D - Bulk Storage','A','02','01','Zone-D-A02-01',1,'2026-10-21 13:06:38'),(58,1,'Zone D - Bulk Storage','A','02','02','Zone-D-A02-02',1,'2026-10-21 13:06:38'),(59,1,'Zone D - Bulk Storage','A','03','01','Zone-D-A03-01',1,'2026-10-21 13:06:38'),(60,1,'Zone D - Bulk Storage','A','03','02','Zone-D-A03-02',1,'2026-10-21 13:06:38'),(61,1,'Zone D - Bulk Storage','B','01','01','Zone-D-B01-01',1,'2026-10-21 13:06:38'),(62,1,'Zone D - Bulk Storage','B','01','02','Zone-D-B01-02',1,'2026-10-21 13:06:38'),(63,1,'Zone D - Bulk Storage','B','02','01','Zone-D-B02-01',1,'2026-10-21 13:06:38'),(64,1,'Zone D - Bulk Storage','B','02','02','Zone-D-B02-02',1,'2026-10-21 13:06:38'),(65,1,'Zone D - Bulk Storage','B','03','01','Zone-D-B03-01',1,'2026-10-21 13:06:38'),(66,1,'Zone D - Bulk Storage','B','03','02','Zone-D-B03-02',1,'2026-10-21 13:06:38'),(67,1,'Zone D - Bulk Storage','C','01','01','Zone-D-C01-01',1,'2026-10-21 13:06:38'),(68,1,'Zone D - Bulk Storage','C','01','02','Zone-D-C01-02',1,'2026-10-21 13:06:38'),(69,1,'Zone D - Bulk Storage','C','02','01','Zone-D-C02-01',1,'2026-10-21 13:06:38'),(70,1,'Zone D - Bulk Storage','C','02','02','Zone-D-C02-02',1,'2026-10-21 13:06:38'),(71,1,'Zone D - Bulk Storage','C','03','01','Zone-D-C03-01',1,'2026-10-21 13:06:38'),(72,1,'Zone D - Bulk Storage','C','03','02','Zone-D-C03-02',1,'2026-10-21 13:06:38'),(73,2,'Zone A - Receiving','A','01','01','Zone-A-A01-01',1,'2026-10-21 13:06:38'),(74,2,'Zone A - Receiving','A','01','02','Zone-A-A01-02',1,'2026-10-21 13:06:38'),(75,2,'Zone A - Receiving','A','02','01','Zone-A-A02-01',1,'2026-10-21 13:06:38'),(76,2,'Zone A - Receiving','A','02','02','Zone-A-A02-02',1,'2026-10-21 13:06:38'),(77,2,'Zone A - Receiving','A','03','01','Zone-A-A03-01',1,'2026-10-21 13:06:38'),(78,2,'Zone A - Receiving','A','03','02','Zone-A-A03-02',1,'2026-10-21 13:06:38'),(79,2,'Zone A - Receiving','B','01','01','Zone-A-B01-01',1,'2026-10-21 13:06:38'),(80,2,'Zone A - Receiving','B','01','02','Zone-A-B01-02',1,'2026-10-21 13:06:38'),(81,2,'Zone A - Receiving','B','02','01','Zone-A-B02-01',1,'2026-10-21 13:06:38'),(82,2,'Zone A - Receiving','B','02','02','Zone-A-B02-02',1,'2026-10-21 13:06:38'),(83,2,'Zone A - Receiving','B','03','01','Zone-A-B03-01',1,'2026-10-21 13:06:38'),(84,2,'Zone A - Receiving','B','03','02','Zone-A-B03-02',1,'2026-10-21 13:06:38'),(85,2,'Zone A - Receiving','C','01','01','Zone-A-C01-01',1,'2026-10-21 13:06:38'),(86,2,'Zone A - Receiving','C','01','02','Zone-A-C01-02',1,'2026-10-21 13:06:38'),(87,2,'Zone A - Receiving','C','02','01','Zone-A-C02-01',1,'2026-10-21 13:06:38'),(88,2,'Zone A - Receiving','C','02','02','Zone-A-C02-02',1,'2026-10-21 13:06:38'),(89,2,'Zone A - Receiving','C','03','01','Zone-A-C03-01',1,'2026-10-21 13:06:38'),(90,2,'Zone A - Receiving','C','03','02','Zone-A-C03-02',1,'2026-10-21 13:06:38'),(91,2,'Zone B - Fast Pick','A','01','01','Zone-B-A01-01',1,'2026-10-21 13:06:38'),(92,2,'Zone B - Fast Pick','A','01','02','Zone-B-A01-02',1,'2026-10-21 13:06:38'),(93,2,'Zone B - Fast Pick','A','02','01','Zone-B-A02-01',1,'2026-10-21 13:06:38'),(94,2,'Zone B - Fast Pick','A','02','02','Zone-B-A02-02',1,'2026-10-21 13:06:38'),(95,2,'Zone B - Fast Pick','A','03','01','Zone-B-A03-01',1,'2026-10-21 13:06:38'),(96,2,'Zone B - Fast Pick','A','03','02','Zone-B-A03-02',1,'2026-10-21 13:06:38'),(97,2,'Zone B - Fast Pick','B','01','01','Zone-B-B01-01',1,'2026-10-21 13:06:38'),(98,2,'Zone B - Fast Pick','B','01','02','Zone-B-B01-02',1,'2026-10-21 13:06:38'),(99,2,'Zone B - Fast Pick','B','02','01','Zone-B-B02-01',1,'2026-10-21 13:06:38'),(100,2,'Zone B - Fast Pick','B','02','02','Zone-B-B02-02',1,'2026-10-21 13:06:38'),(101,2,'Zone B - Fast Pick','B','03','01','Zone-B-B03-01',1,'2026-10-21 13:06:38'),(102,2,'Zone B - Fast Pick','B','03','02','Zone-B-B03-02',1,'2026-10-21 13:06:38'),(103,2,'Zone B - Fast Pick','C','01','01','Zone-B-C01-01',1,'2026-10-21 13:06:38'),(104,2,'Zone B - Fast Pick','C','01','02','Zone-B-C01-02',1,'2026-10-21 13:06:38'),(105,2,'Zone B - Fast Pick','C','02','01','Zone-B-C02-01',1,'2026-10-21 13:06:38'),(106,2,'Zone B - Fast Pick','C','02','02','Zone-B-C02-02',1,'2026-10-21 13:06:38'),(107,2,'Zone B - Fast Pick','C','03','01','Zone-B-C03-01',1,'2026-10-21 13:06:38'),(108,2,'Zone B - Fast Pick','C','03','02','Zone-B-C03-02',1,'2026-10-21 13:06:38'),(109,2,'Zone C - Cold Storage','A','01','01','Zone-C-A01-01',1,'2026-10-21 13:06:38'),(110,2,'Zone C - Cold Storage','A','01','02','Zone-C-A01-02',1,'2026-10-21 13:06:38'),(111,2,'Zone C - Cold Storage','A','02','01','Zone-C-A02-01',1,'2026-10-21 13:06:38'),(112,2,'Zone C - Cold Storage','A','02','02','Zone-C-A02-02',1,'2026-10-21 13:06:38'),(113,2,'Zone C - Cold Storage','A','03','01','Zone-C-A03-01',1,'2026-10-21 13:06:38'),(114,2,'Zone C - Cold Storage','A','03','02','Zone-C-A03-02',1,'2026-10-21 13:06:38'),(115,2,'Zone C - Cold Storage','B','01','01','Zone-C-B01-01',1,'2026-10-21 13:06:38'),(116,2,'Zone C - Cold Storage','B','01','02','Zone-C-B01-02',1,'2026-10-21 13:06:38'),(117,2,'Zone C - Cold Storage','B','02','01','Zone-C-B02-01',1,'2026-10-21 13:06:38'),(118,2,'Zone C - Cold Storage','B','02','02','Zone-C-B02-02',1,'2026-10-21 13:06:38'),(119,2,'Zone C - Cold Storage','B','03','01','Zone-C-B03-01',1,'2026-10-21 13:06:38'),(120,2,'Zone C - Cold Storage','B','03','02','Zone-C-B03-02',1,'2026-10-21 13:06:38'),(121,2,'Zone C - Cold Storage','C','01','01','Zone-C-C01-01',1,'2026-10-21 13:06:38'),(122,2,'Zone C - Cold Storage','C','01','02','Zone-C-C01-02',1,'2026-10-21 13:06:38'),(123,2,'Zone C - Cold Storage','C','02','01','Zone-C-C02-01',1,'2026-10-21 13:06:38'),(124,2,'Zone C - Cold Storage','C','02','02','Zone-C-C02-02',1,'2026-10-21 13:06:38'),(125,2,'Zone C - Cold Storage','C','03','01','Zone-C-C03-01',1,'2026-10-21 13:06:38'),(126,2,'Zone C - Cold Storage','C','03','02','Zone-C-C03-02',1,'2026-10-21 13:06:38'),(127,3,'Zone A - Staging','A','01','01','Zone-A-A01-01',1,'2026-10-21 13:06:38'),(128,3,'Zone A - Staging','A','01','02','Zone-A-A01-02',1,'2026-10-21 13:06:38'),(129,3,'Zone A - Staging','A','02','01','Zone-A-A02-01',1,'2026-10-21 13:06:38'),(130,3,'Zone A - Staging','A','02','02','Zone-A-A02-02',1,'2026-10-21 13:06:38'),(131,3,'Zone A - Staging','A','03','01','Zone-A-A03-01',1,'2026-10-21 13:06:38'),(132,3,'Zone A - Staging','A','03','02','Zone-A-A03-02',1,'2026-10-21 13:06:38'),(133,3,'Zone A - Staging','B','01','01','Zone-A-B01-01',1,'2026-10-21 13:06:38'),(134,3,'Zone A - Staging','B','01','02','Zone-A-B01-02',1,'2026-10-21 13:06:38'),(135,3,'Zone A - Staging','B','02','01','Zone-A-B02-01',1,'2026-10-21 13:06:38'),(136,3,'Zone A - Staging','B','02','02','Zone-A-B02-02',1,'2026-10-21 13:06:38'),(137,3,'Zone A - Staging','B','03','01','Zone-A-B03-01',1,'2026-10-21 13:06:38'),(138,3,'Zone A - Staging','B','03','02','Zone-A-B03-02',1,'2026-10-21 13:06:38'),(139,3,'Zone A - Staging','C','01','01','Zone-A-C01-01',1,'2026-10-21 13:06:38'),(140,3,'Zone A - Staging','C','01','02','Zone-A-C01-02',1,'2026-10-21 13:06:38'),(141,3,'Zone A - Staging','C','02','01','Zone-A-C02-01',1,'2026-10-21 13:06:38'),(142,3,'Zone A - Staging','C','02','02','Zone-A-C02-02',1,'2026-10-21 13:06:38'),(143,3,'Zone A - Staging','C','03','01','Zone-A-C03-01',1,'2026-10-21 13:06:38'),(144,3,'Zone A - Staging','C','03','02','Zone-A-C03-02',1,'2026-10-21 13:06:38'),(145,3,'Zone B - Standard Pallet','A','01','01','Zone-B-A01-01',1,'2026-10-21 13:06:38'),(146,3,'Zone B - Standard Pallet','A','01','02','Zone-B-A01-02',1,'2026-10-21 13:06:38'),(147,3,'Zone B - Standard Pallet','A','02','01','Zone-B-A02-01',1,'2026-10-21 13:06:38'),(148,3,'Zone B - Standard Pallet','A','02','02','Zone-B-A02-02',1,'2026-10-21 13:06:38'),(149,3,'Zone B - Standard Pallet','A','03','01','Zone-B-A03-01',1,'2026-10-21 13:06:38'),(150,3,'Zone B - Standard Pallet','A','03','02','Zone-B-A03-02',1,'2026-10-21 13:06:38'),(151,3,'Zone B - Standard Pallet','B','01','01','Zone-B-B01-01',1,'2026-10-21 13:06:38'),(152,3,'Zone B - Standard Pallet','B','01','02','Zone-B-B01-02',1,'2026-10-21 13:06:38'),(153,3,'Zone B - Standard Pallet','B','02','01','Zone-B-B02-01',1,'2026-10-21 13:06:38'),(154,3,'Zone B - Standard Pallet','B','02','02','Zone-B-B02-02',1,'2026-10-21 13:06:38'),(155,3,'Zone B - Standard Pallet','B','03','01','Zone-B-B03-01',1,'2026-10-21 13:06:38'),(156,3,'Zone B - Standard Pallet','B','03','02','Zone-B-B03-02',1,'2026-10-21 13:06:38'),(157,3,'Zone B - Standard Pallet','C','01','01','Zone-B-C01-01',1,'2026-10-21 13:06:38'),(158,3,'Zone B - Standard Pallet','C','01','02','Zone-B-C01-02',1,'2026-10-21 13:06:38'),(159,3,'Zone B - Standard Pallet','C','02','01','Zone-B-C02-01',1,'2026-10-21 13:06:38'),(160,3,'Zone B - Standard Pallet','C','02','02','Zone-B-C02-02',1,'2026-10-21 13:06:38'),(161,3,'Zone B - Standard Pallet','C','03','01','Zone-B-C03-01',1,'2026-10-21 13:06:38'),(162,3,'Zone B - Standard Pallet','C','03','02','Zone-B-C03-02',1,'2026-10-21 13:06:38'),(163,3,'Zone C - Oversize','A','01','01','Zone-C-A01-01',1,'2026-10-21 13:06:38'),(164,3,'Zone C - Oversize','A','01','02','Zone-C-A01-02',1,'2026-10-21 13:06:38'),(165,3,'Zone C - Oversize','A','02','01','Zone-C-A02-01',1,'2026-10-21 13:06:38'),(166,3,'Zone C - Oversize','A','02','02','Zone-C-A02-02',1,'2026-10-21 13:06:38'),(167,3,'Zone C - Oversize','A','03','01','Zone-C-A03-01',1,'2026-10-21 13:06:38'),(168,3,'Zone C - Oversize','A','03','02','Zone-C-A03-02',1,'2026-10-21 13:06:38'),(169,3,'Zone C - Oversize','B','01','01','Zone-C-B01-01',1,'2026-10-21 13:06:38'),(170,3,'Zone C - Oversize','B','01','02','Zone-C-B01-02',1,'2026-10-21 13:06:38'),(171,3,'Zone C - Oversize','B','02','01','Zone-C-B02-01',1,'2026-10-21 13:06:38'),(172,3,'Zone C - Oversize','B','02','02','Zone-C-B02-02',1,'2026-10-21 13:06:38'),(173,3,'Zone C - Oversize','B','03','01','Zone-C-B03-01',1,'2026-10-21 13:06:38'),(174,3,'Zone C - Oversize','B','03','02','Zone-C-B03-02',1,'2026-10-21 13:06:38'),(175,3,'Zone C - Oversize','C','01','01','Zone-C-C01-01',1,'2026-10-21 13:06:38'),(176,3,'Zone C - Oversize','C','01','02','Zone-C-C01-02',1,'2026-10-21 13:06:38'),(177,3,'Zone C - Oversize','C','02','01','Zone-C-C02-01',1,'2026-10-21 13:06:38'),(178,3,'Zone C - Oversize','C','02','02','Zone-C-C02-02',1,'2026-10-21 13:06:38'),(179,3,'Zone C - Oversize','C','03','01','Zone-C-C03-01',1,'2026-10-21 13:06:38'),(180,3,'Zone C - Oversize','C','03','02','Zone-C-C03-02',1,'2026-10-21 13:06:38');
/*!40000 ALTER TABLE `storage_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'USA',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_suppliers_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'TechParts Global','SUP-001','James Wilson','james@techpartsglobal.com','+1-555-0101','400 Tech Pkwy','San Jose','CA','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'Pacific Textiles Inc','SUP-002','Linda Nguyen','linda@pacifictextiles.com','+1-555-0102','88 Fabric Lane','Los Angeles','CA','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'MegaFood Distributors','SUP-003','Bob Martinez','bob@megafood.com','+1-555-0103','220 Harvest Rd','Chicago','IL','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,'SafetyFirst Equipment','SUP-004','Karen Brooks','karen@safetyfirst.com','+1-555-0104','55 Shield Ave','Houston','TX','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(5,'OfficeMax Wholesale','SUP-005','David Park','david@officemaxwholesale.com','+1-555-0105','730 Paper Ct','Phoenix','AZ','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(6,'AutoZone Parts Supply','SUP-006','Rachel Green','rachel@autozoneparts.com','+1-555-0106','1200 Motor Blvd','Detroit','MI','USA',1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','manager','staff','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staff',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@warehouse.com','$2a$10$tTaojUHfCdcUeoFkcAl1eOiQ4dZUe5i5Kgmzb8lURq5KkMBFb99iW','Alex Thompson','admin',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'manager','manager@warehouse.com','$2a$10$tTaojUHfCdcUeoFkcAl1eOqScyc2JsYr2LtbgDE.ONhaOCDwUCV.W','Sarah Chen','manager',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'staff','staff@warehouse.com','$2a$10$tTaojUHfCdcUeoFkcAl1eOQuEnNh7t59F3EfltPcVkU9Lhq1actRW','Mike Rodriguez','staff',1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(4,'viewer','viewer@warehouse.com','$2a$10$tTaojUHfCdcUeoFkcAl1eOUz6NrVf7eB9.5RW6.U.KHh6GVuX4bAO','Emily Davis','viewer',1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'USA',
  `capacity` int DEFAULT '10000',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_warehouses_code` (`code`),
  KEY `idx_warehouses_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'Main Fulfillment Hub','WH-001','1500 Industrial Blvd','Dallas','TX','USA',25000,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(2,'East Distribution Center','WH-002','820 Commerce Way','Atlanta','GA','USA',18000,1,'2026-10-21 13:06:38','2026-10-21 13:06:38'),(3,'West Coast Logistics Center','WH-003','3200 Pacific Ave','Portland','OR','USA',15000,1,'2026-10-21 13:06:38','2026-10-21 13:06:38');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30  8:37:03
