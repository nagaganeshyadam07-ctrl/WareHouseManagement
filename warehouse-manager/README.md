# Warehouse Stock & Shipment Management System

An enterprise-grade, offline-capable warehouse management and fulfillment platform designed according to clean, human-centered product principles (inspired by Google's utility-first design: compact data density, restrained cool-gray palette, 1px subtle borders, and zero decorative AI fluff).

---

## Technical Stack & Architecture

- **Frontend**: React 18.3, TypeScript 5.6, Tailwind CSS v4, Vite 5.4, React Router 7, Heroicons v2, Recharts
- **Backend**: Node.js 20 LTS, Express 4.18, TypeScript, JWT (`jsonwebtoken`) + Express Session, bcryptjs, Helmet, CORS
- **Database**: MySQL 8.0 Community Server (InnoDB engine, ACID transactions, `SELECT ... FOR UPDATE` row-level locks, 20 relational tables, 44 foreign key constraints)
- **Deployment & Containers**: Docker, Docker Compose, Nginx Alpine, Multi-stage Node Alpine builds
- **Offline Capabilities**: 100% self-contained local binary persistence with single-click macOS and Windows launchers

---

## Default User Accounts

The database comes pre-seeded with four operational roles:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Administrator** | Full access to inventory, shipments, orders, facilities, and audit log |
| `manager` | `manager123` | **Warehouse Manager** | Inventory adjustments, receipt approvals, shipment dispatch, orders |
| `staff` | `staff123` | **Warehouse Staff** | Putaway receiving, order picking, packing, stock counts |
| `viewer` | `viewer123` | **Viewer / Auditor** | Read-only access to catalogs, stock metrics, and shipment tracking |

---

## Quick Start Options

### Option 1: Native Offline Launch (macOS)

1. Double-click **`WarehouseManager.command`** in the project folder (or on your Desktop).
2. The launcher will automatically start the MySQL daemon, backend Express server, frontend Vite client, and open Google Chrome to `http://localhost:5173`.
3. To stop all services, run `./stop.sh`.

### Option 2: Docker Compose (Any OS / Cloud Deployment)

Run the entire multi-service stack (MySQL 8 + Node API + Nginx Frontend) with one command:

```bash
docker compose up --build
```

- **Frontend UI**: `http://localhost:80`
- **Backend REST API**: `http://localhost:3001`
- **MySQL Database**: `localhost:3306` (Database: `warehouse_db`, User: `root`, Password: `rootpassword`)

The database automatically imports `server/src/database/warehouse_dump.sql` on first launch.

### Option 3: Manual Local Development

#### Prerequisites
- Node.js 18+ or 20 LTS
- MySQL 8.0+

#### 1. Setup Backend
```bash
cd server
npm install
cp .env.example .env

# Initialize database schema and seed data
npm run init-db
npm run seed

# Run automated test suite (8/8 workflow tests)
npm test

# Start backend server
npm run dev
```

#### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Project Structure

```
warehouse-manager/
├── client/                                  # React 18 + TypeScript Frontend
│   ├── src/
│   │   ├── api/                             # Typed REST API service clients
│   │   ├── components/                      # Reusable UI & Layout components
│   │   ├── contexts/                        # Global AuthContext & session state
│   │   ├── pages/                           # Application domain views
│   │   └── types/                           # Shared TypeScript definitions
│   ├── Dockerfile                           # Multi-stage production Nginx container
│   ├── nginx.conf                           # Nginx reverse proxy configuration
│   └── vite.config.ts                       # Vite bundler config with Tailwind v4
│
├── server/                                  # Node.js + Express Backend
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.ts                        # MySQL2 connection pooling & transactions
│   │   │   ├── schema.sql                   # Complete 20-table DDL schema
│   │   │   ├── seed.ts                      # Idempotent database seeder
│   │   │   └── warehouse_dump.sql           # Full SQL database export
│   │   ├── middleware/                      # Auth & RBAC role guards
│   │   ├── routes/                          # REST controllers
│   │   └── tests/                           # Integration workflow tests
│   ├── Dockerfile                           # Multi-stage production Node container
│   └── .env.example                         # Environment variable template
│
├── docs/                                    # Technical Documentation
│   └── architecture_and_er_diagram.html     # Self-contained printable architecture report
│
├── Warehouse_Manager_Architecture_and_ER_Diagram.pdf # 826KB Vector Architecture & ER PDF
├── docker-compose.yml                       # Unified multi-service deployment spec
├── WarehouseManager.command                 # macOS double-click native launcher
├── start.sh                                 # Bash service startup daemon
├── stop.sh                                  # Bash service shutdown daemon
└── run-offline.bat                          # Windows offline batch launcher
```

---

## Database Architecture & Concurrency Control

- **20 InnoDB Relational Tables**: `users`, `categories`, `warehouses`, `storage_locations`, `suppliers`, `products`, `inventory`, `inventory_movements`, `orders`, `order_items`, `stock_reservations`, `inbound_receipts`, `receipt_items`, `shipments`, `shipment_items`, `shipment_status_events`, `stock_adjustments`, `inventory_transfers`, `audit_log`, `sessions`.
- **Concurrency & Idempotency**: All physical stock deductions and shipment dispatches execute under explicit MySQL transactions using `SELECT ... FOR UPDATE` row-level locks, returning `HTTP 409 Conflict` to guarantee zero double-dispatches or negative stock anomalies.
- **Specification**: See [Warehouse_Manager_Architecture_and_ER_Diagram.pdf](Warehouse_Manager_Architecture_and_ER_Diagram.pdf) for complete ER diagrams, table schemas, and flowcharts.
