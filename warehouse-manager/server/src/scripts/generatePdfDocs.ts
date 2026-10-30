import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const HTML_OUTPUT_PATH = path.resolve(__dirname, '../../../docs/architecture_and_er_diagram.html');
const PDF_DESKTOP_PATH = '/Users/nagaganesh/Desktop/Warehouse_Manager_Architecture_and_ER_Diagram.pdf';
const PDF_PROJECT_PATH = path.resolve(__dirname, '../../../Warehouse_Manager_Architecture_and_ER_Diagram.pdf');

// Ensure docs directory exists
fs.mkdirSync(path.dirname(HTML_OUTPUT_PATH), { recursive: true });

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Warehouse Management System — Architecture & ER Specification</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 16mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 11pt;
      -webkit-font-smoothing: antialiased;
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }

    /* Header / Cover Section */
    .header-banner {
      border-bottom: 2px solid #1a73e8;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .header-title {
      font-size: 24pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .header-subtitle {
      font-size: 13pt;
      color: #475569;
      font-weight: 400;
      margin-bottom: 14px;
    }
    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-primary { background: #e8f0fe; color: #1a73e8; border: 1px solid #c2e7ff; }
    .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-neutral { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* Meta Info Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 28px;
      font-size: 9pt;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    /* Section Styling */
    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 18px;
      background: #1a73e8;
      border-radius: 2px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      color: #334155;
      font-size: 9.5pt;
      line-height: 1.55;
      margin-bottom: 10px;
    }

    /* Data Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.4px;
    }
    th:last-child {
      border-right: none;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: top;
    }
    td:last-child {
      border-right: none;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    tr:last-child td {
      border-bottom: none;
    }

    .code-pill {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    .key-pk {
      font-family: ui-monospace, monospace;
      font-size: 7.5pt;
      font-weight: bold;
      color: #b45309;
      background: #fef3c7;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #fde68a;
      display: inline-block;
    }

    .key-fk {
      font-family: ui-monospace, monospace;
      font-size: 7.5pt;
      font-weight: bold;
      color: #1d4ed8;
      background: #dbeafe;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #bfdbfe;
      display: inline-block;
    }

    .key-idx {
      font-family: ui-monospace, monospace;
      font-size: 7.5pt;
      color: #64748b;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      display: inline-block;
    }

    /* ER Visual Cards Grid */
    .er-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .entity-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      overflow: hidden;
      page-break-inside: avoid;
    }
    .entity-header {
      background: #f1f5f9;
      padding: 6px 10px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .entity-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .entity-cluster {
      font-size: 7pt;
      color: #475569;
      text-transform: uppercase;
      background: #e2e8f0;
      padding: 2px 5px;
      border-radius: 3px;
    }
    .entity-body {
      padding: 6px 8px;
    }
    .entity-col-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5px 4px;
      border-bottom: 1px solid #f8fafc;
      font-size: 7.8pt;
    }
    .entity-col-row:last-child {
      border-bottom: none;
    }
    .col-name {
      font-family: ui-monospace, monospace;
      color: #1e293b;
      font-weight: 500;
    }
    .col-type {
      font-family: ui-monospace, monospace;
      color: #64748b;
      font-size: 7.2pt;
    }

    /* Architecture Flow Box */
    .flow-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 18px;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    .flow-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .flow-step:last-child {
      margin-bottom: 0;
    }
    .step-number {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1a73e8;
      color: #ffffff;
      font-weight: bold;
      font-size: 7.5pt;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .step-desc {
      color: #475569;
      font-size: 8pt;
    }

    /* Footer */
    .doc-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- COVER / HEADER -->
  <div class="header-banner">
    <div class="header-title">Warehouse Management System</div>
    <div class="header-subtitle">Technical Architecture, Entity-Relationship (ER) Specification & Technology Stack</div>
    <div class="badge-bar">
      <span class="badge badge-primary">MySQL 8.0.46 InnoDB</span>
      <span class="badge badge-primary">Node.js 20.18 + Express</span>
      <span class="badge badge-primary">React 18 + TypeScript</span>
      <span class="badge badge-primary">Tailwind CSS v4</span>
      <span class="badge badge-success">Zero Cloud Dependency / 100% Offline</span>
      <span class="badge badge-neutral">ACID Compliant</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Architecture Pattern</strong>
      Modular REST + SPA Tier
    </div>
    <div class="meta-item">
      <strong>Total Database Tables</strong>
      20 InnoDB Relational Tables
    </div>
    <div class="meta-item">
      <strong>Foreign Key Relations</strong>
      44 Referential Constraints
    </div>
    <div class="meta-item">
      <strong>Target Environment</strong>
      macOS Native / Standalone
    </div>
  </div>

  <!-- SECTION 1: EXECUTIVE OVERVIEW -->
  <h2>1. System Architecture & Operational Capabilities</h2>
  <p>
    The Warehouse Stock & Shipment Management System is an enterprise-grade warehouse execution and logistics control platform designed according to clean, restrained human-centered engineering principles. The platform eliminates extraneous visual clutter in favor of maximum operational density, sub-second query response, and strict transactional consistency.
  </p>
  <p>
    The application operates completely offline on local hardware without recurring internet calls or SaaS lock-in, with local persistence stored in an InnoDB binary database structure.
  </p>

  <div class="flow-box">
    <div class="flow-step">
      <div class="step-number">1</div>
      <div class="step-content">
        <div class="step-title">Master Catalog & Multi-Warehouse Bin Topology</div>
        <div class="step-desc">Hierarchical mapping of commercial inventory across regional facilities, zones, aisles, racks, and discrete storage bins with custom barcodes.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">2</div>
      <div class="step-content">
        <div class="step-title">Inbound ASN Intake & Putaway Processing</div>
        <div class="step-desc">Structured vendor purchase order receipts verifying manifests, recording physical counts, logging damaged units, and assigning destination bins.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">3</div>
      <div class="step-content">
        <div class="step-title">Order Allocation & Concurrency-Safe Reservations</div>
        <div class="step-desc">Automated reservation locks prevent over-promising and race conditions by isolating available stock from committed inventory.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">4</div>
      <div class="step-content">
        <div class="step-title">Outbound Pick, Pack, Dispatch & Carrier Tracking</div>
        <div class="step-desc">Multi-stage outbound fulfillment pipeline with pick lists, package verification, tracking numbers, and atomic physical deductions upon dispatch.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">5</div>
      <div class="step-content">
        <div class="step-title">Security, Role-Based Access & Tamper-Evident Auditing</div>
        <div class="step-desc">Four-tier role permissions (Admin, Manager, Staff, Viewer), password salting with bcrypt, and immutable audit logs capturing every critical state change.</div>
      </div>
    </div>
  </div>

  <!-- SECTION 2: TECHNOLOGIES USED -->
  <div class="page-break"></div>
  <h2>2. Technologies Used & Architecture Matrix</h2>
  <p>
    The following matrix details all foundational libraries, frameworks, database systems, and runtime utilities employed across the backend, frontend, database, and automation layers.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Tier / Domain</th>
        <th style="width: 22%;">Technology & Version</th>
        <th style="width: 20%;">Package / Binary</th>
        <th>Architectural Purpose & Implementation Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Primary Database</strong></td>
        <td><strong>MySQL Community Server</strong><br><span class="code-pill">8.0.46</span></td>
        <td><span class="code-pill">mysqld</span> binary</td>
        <td>High-performance relational engine running <strong>InnoDB</strong>. Enforces ACID guarantees, row-level locks (<span class="code-pill">SELECT ... FOR UPDATE</span>), foreign key referential integrity, and persistent local data storage.</td>
      </tr>
      <tr>
        <td><strong>Database Client</strong></td>
        <td><strong>mysql2 / promise</strong><br><span class="code-pill">^3.9.7</span></td>
        <td><span class="code-pill">mysql2</span></td>
        <td>Asynchronous Promise-based connection pooling with connection recycling, parameterized prepared statements against SQL injection, and programmatic transaction lifecycle control.</td>
      </tr>
      <tr>
        <td><strong>Server Runtime</strong></td>
        <td><strong>Node.js LTS</strong><br><span class="code-pill">v20.18.0</span></td>
        <td><span class="code-pill">node</span></td>
        <td>Local high-throughput event loop executing backend microservices without external cloud dependencies.</td>
      </tr>
      <tr>
        <td><strong>Web Application Framework</strong></td>
        <td><strong>Express.js</strong><br><span class="code-pill">^4.18.2</span></td>
        <td><span class="code-pill">express</span></td>
        <td>RESTful routing architecture organizing modular controllers for authentication, catalog, inventory, receiving, orders, shipments, suppliers, audit logs, and analytics.</td>
      </tr>
      <tr>
        <td><strong>Programming Language</strong></td>
        <td><strong>TypeScript</strong><br><span class="code-pill">^5.6.2</span></td>
        <td><span class="code-pill">typescript</span></td>
        <td>Strict end-to-end type safety shared between API schemas, database entity types, and frontend React components.</td>
      </tr>
      <tr>
        <td><strong>Authentication & Sessions</strong></td>
        <td><strong>JWT + Express-Session</strong><br><span class="code-pill">jsonwebtoken 9.0.2</span></td>
        <td><span class="code-pill">express-session</span></td>
        <td>Hybrid stateful/stateless authentication providing Bearer token headers for API interactions and HTTP-only cookie sessions for browser navigation.</td>
      </tr>
      <tr>
        <td><strong>Password Cryptography</strong></td>
        <td><strong>bcryptjs</strong><br><span class="code-pill">^2.4.3</span></td>
        <td><span class="code-pill">bcryptjs</span></td>
        <td>10-round salted adaptive password hashing guaranteeing cryptographically secure credential persistence in the <span class="code-pill">users</span> table.</td>
      </tr>
      <tr>
        <td><strong>HTTP Security & CORS</strong></td>
        <td><strong>Helmet & CORS</strong><br><span class="code-pill">helmet 7.1 / cors 2.8</span></td>
        <td><span class="code-pill">helmet</span>, <span class="code-pill">cors</span></td>
        <td>Hardened HTTP response headers (Content-Security-Policy, HSTS, X-Frame-Options) and strict origin validation restricting unauthorized client access.</td>
      </tr>
      <tr>
        <td><strong>UI Framework</strong></td>
        <td><strong>React</strong><br><span class="code-pill">18.3.1</span></td>
        <td><span class="code-pill">react</span>, <span class="code-pill">react-dom</span></td>
        <td>Declarative component architecture with custom hooks, unified <span class="code-pill">AuthContext</span>, and high-frequency state updates.</td>
      </tr>
      <tr>
        <td><strong>Build Tool & Bundler</strong></td>
        <td><strong>Vite</strong><br><span class="code-pill">5.4.21</span></td>
        <td><span class="code-pill">vite</span></td>
        <td>Lightning-fast Rollup-based asset bundler with ES-module Hot Module Replacement (HMR) and optimized tree-shaken static compilation.</td>
      </tr>
      <tr>
        <td><strong>Design System & Styling</strong></td>
        <td><strong>Tailwind CSS v4</strong><br><span class="code-pill">4.3.3</span></td>
        <td><span class="code-pill">@tailwindcss/vite</span></td>
        <td>Google product aesthetic: restrained slate palette, 1px subtle borders, precise typographic scale, compact table layouts, and responsive grids.</td>
      </tr>
      <tr>
        <td><strong>Client-Side Routing</strong></td>
        <td><strong>React Router DOM</strong><br><span class="code-pill">7.18.4</span></td>
        <td><span class="code-pill">react-router-dom</span></td>
        <td>Client-side route guards, authenticated redirects, deep-linking, and URL search parameter synchronization.</td>
      </tr>
      <tr>
        <td><strong>Iconography</strong></td>
        <td><strong>Heroicons v2</strong><br><span class="code-pill">2.2.0</span></td>
        <td><span class="code-pill">@heroicons/react</span></td>
        <td>Pure vector SVG line icons maintaining visual elegance and semantic clarity without decorative emoji.</td>
      </tr>
      <tr>
        <td><strong>Data Visualization</strong></td>
        <td><strong>Recharts</strong><br><span class="code-pill">3.10.1</span></td>
        <td><span class="code-pill">recharts</span></td>
        <td>SVG-rendered operational dashboards tracking daily stock movements, inventory thresholds, and shipment statuses.</td>
      </tr>
      <tr>
        <td><strong>Offline Automation Scripts</strong></td>
        <td><strong>macOS Command & Shell</strong><br><span class="code-pill">POSIX / ZSH</span></td>
        <td><span class="code-pill">WarehouseManager.command</span></td>
        <td>Single-click native desktop launcher orchestrating MySQL daemon startup, Express server instantiation, Vite frontend serving, and automatic Chrome browser launch.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: ER TOPOLOGY & RELATIONSHIPS -->
  <div class="page-break"></div>
  <h2>3. Database Entity-Relationship (ER) Architecture</h2>
  <p>
    The database consists of <strong>20 InnoDB tables</strong> organized into five interconnected functional clusters. All primary keys are auto-incrementing integers, and referential integrity is strictly enforced via 44 foreign key constraints with explicit <span class="code-pill">CASCADE</span> or <span class="code-pill">SET NULL</span> behaviors.
  </p>

  <!-- Visual SVG Topology Map -->
  <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 20px;">
    <div style="font-size: 8.5pt; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
      High-Level Entity Relationship Topology
    </div>
    <svg viewBox="0 0 740 320" style="width: 100%; height: auto; font-family: -apple-system, sans-serif;">
      <!-- Cluster Backgrounds -->
      <rect x="10" y="10" width="220" height="140" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
      <text x="20" y="30" font-size="9" font-weight="bold" fill="#1e40af">CLUSTER A: CATALOG & FACILITY</text>
      
      <rect x="260" y="10" width="220" height="140" rx="6" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
      <text x="270" y="30" font-size="9" font-weight="bold" fill="#166534">CLUSTER B: LIVE INVENTORY</text>
      
      <rect x="510" y="10" width="220" height="140" rx="6" fill="#fefce8" stroke="#fef08a" stroke-width="1"/>
      <text x="520" y="30" font-size="9" font-weight="bold" fill="#854d0e">CLUSTER C: INBOUND RECEIVING</text>

      <rect x="10" y="170" width="220" height="140" rx="6" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1"/>
      <text x="20" y="190" font-size="9" font-weight="bold" fill="#6b21a8">CLUSTER D: ORDERS & RESERVATIONS</text>

      <rect x="260" y="170" width="220" height="140" rx="6" fill="#fff7ed" stroke="#fed7aa" stroke-width="1"/>
      <text x="270" y="190" font-size="9" font-weight="bold" fill="#9a3412">CLUSTER E: OUTBOUND LOGISTICS</text>

      <rect x="510" y="170" width="220" height="140" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <text x="520" y="190" font-size="9" font-weight="bold" fill="#334155">CLUSTER F: SECURITY & AUDIT</text>

      <!-- Entity Badges A -->
      <rect x="20" y="45" width="90" height="24" rx="4" fill="#ffffff" stroke="#93c5fd" />
      <text x="28" y="61" font-size="8" font-family="monospace" font-weight="bold" fill="#1e3a8a">products</text>
      <rect x="125" y="45" width="90" height="24" rx="4" fill="#ffffff" stroke="#93c5fd" />
      <text x="133" y="61" font-size="8" font-family="monospace" font-weight="bold" fill="#1e3a8a">categories</text>
      <rect x="20" y="80" width="90" height="24" rx="4" fill="#ffffff" stroke="#93c5fd" />
      <text x="28" y="96" font-size="8" font-family="monospace" font-weight="bold" fill="#1e3a8a">warehouses</text>
      <rect x="125" y="80" width="95" height="24" rx="4" fill="#ffffff" stroke="#93c5fd" />
      <text x="130" y="96" font-size="7.5" font-family="monospace" font-weight="bold" fill="#1e3a8a">storage_locs</text>
      <rect x="20" y="115" width="90" height="24" rx="4" fill="#ffffff" stroke="#93c5fd" />
      <text x="28" y="131" font-size="8" font-family="monospace" font-weight="bold" fill="#1e3a8a">suppliers</text>

      <!-- Entity Badges B -->
      <rect x="270" y="45" width="95" height="24" rx="4" fill="#ffffff" stroke="#86efac" />
      <text x="278" y="61" font-size="8" font-family="monospace" font-weight="bold" fill="#14532d">inventory</text>
      <rect x="375" y="45" width="95" height="24" rx="4" fill="#ffffff" stroke="#86efac" />
      <text x="380" y="61" font-size="7.5" font-family="monospace" font-weight="bold" fill="#14532d">movements</text>
      <rect x="270" y="80" width="95" height="24" rx="4" fill="#ffffff" stroke="#86efac" />
      <text x="275" y="96" font-size="7.5" font-family="monospace" font-weight="bold" fill="#14532d">adjustments</text>
      <rect x="375" y="80" width="95" height="24" rx="4" fill="#ffffff" stroke="#86efac" />
      <text x="382" y="96" font-size="7.5" font-family="monospace" font-weight="bold" fill="#14532d">transfers</text>

      <!-- Entity Badges C -->
      <rect x="520" y="45" width="100" height="24" rx="4" fill="#ffffff" stroke="#fde047" />
      <text x="526" y="61" font-size="8" font-family="monospace" font-weight="bold" fill="#713f12">inbound_rcpts</text>
      <rect x="630" y="45" width="90" height="24" rx="4" fill="#ffffff" stroke="#fde047" />
      <text x="638" y="61" font-size="8" font-family="monospace" font-weight="bold" fill="#713f12">receipt_items</text>

      <!-- Entity Badges D -->
      <rect x="20" y="205" width="90" height="24" rx="4" fill="#ffffff" stroke="#d8b4fe" />
      <text x="28" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#581c87">orders</text>
      <rect x="125" y="205" width="95" height="24" rx="4" fill="#ffffff" stroke="#d8b4fe" />
      <text x="132" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#581c87">order_items</text>
      <rect x="20" y="240" width="120" height="24" rx="4" fill="#ffffff" stroke="#d8b4fe" />
      <text x="26" y="256" font-size="7.5" font-family="monospace" font-weight="bold" fill="#581c87">stock_reservations</text>

      <!-- Entity Badges E -->
      <rect x="270" y="205" width="95" height="24" rx="4" fill="#ffffff" stroke="#fdba74" />
      <text x="278" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#7c2d12">shipments</text>
      <rect x="375" y="205" width="95" height="24" rx="4" fill="#ffffff" stroke="#fdba74" />
      <text x="380" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#7c2d12">shipment_items</text>
      <rect x="270" y="240" width="120" height="24" rx="4" fill="#ffffff" stroke="#fdba74" />
      <text x="276" y="256" font-size="7.5" font-family="monospace" font-weight="bold" fill="#7c2d12">shipment_events</text>

      <!-- Entity Badges F -->
      <rect x="520" y="205" width="90" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" />
      <text x="528" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#0f172a">users</text>
      <rect x="625" y="205" width="95" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" />
      <text x="635" y="221" font-size="8" font-family="monospace" font-weight="bold" fill="#0f172a">audit_log</text>
      <rect x="520" y="240" width="90" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" />
      <text x="528" y="256" font-size="8" font-family="monospace" font-weight="bold" fill="#0f172a">sessions</text>

      <!-- Connection Lines with Arrows -->
      <path d="M 110 57 L 270 57" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3,3" fill="none" />
      <path d="M 65 205 L 65 140" stroke="#8b5cf6" stroke-width="1.5" fill="none" />
      <path d="M 215 217 L 270 217" stroke="#f97316" stroke-width="1.5" fill="none" />
      <path d="M 317 69 L 317 205" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" fill="none" />
      <path d="M 520 57 L 365 57" stroke="#eab308" stroke-width="1.5" stroke-dasharray="3,3" fill="none" />
    </svg>
    <div style="font-size: 7.5pt; color: #64748b; text-align: center; margin-top: 4px;">
      Legend: Solid Lines = Direct Order/Shipment Flow; Dashed Lines = Inventory Allocation & Physical Ledger Deductions
    </div>
  </div>

  <!-- SECTION 4: FULL DATA DICTIONARY -->
  <div class="page-break"></div>
  <h2>4. Comprehensive Database Data Dictionary (20 Tables)</h2>
  <p>
    The detailed technical specifications below describe all 20 InnoDB tables, indexing strategies, nullability rules, and domain-level business constraints.
  </p>

  <!-- TABLE 1 & 2 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">1. users</span>
        <span class="entity-cluster">Security</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">username</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">email</span></span> <span class="col-type">VARCHAR(191) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">password_hash</span></span> <span class="col-type">VARCHAR(255) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">full_name</span></span> <span class="col-type">VARCHAR(255) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">role</span></span> <span class="col-type">ENUM('admin','manager','staff','viewer')</span></div>
        <div class="entity-col-row"><span><span class="col-name">is_active</span></span> <span class="col-type">TINYINT DEFAULT 1</span></div>
        <div class="entity-col-row"><span><span class="col-name">created_at</span></span> <span class="col-type">TIMESTAMP DEFAULT NOW</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">2. categories</span>
        <span class="entity-cluster">Master Data</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">name</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">description</span></span> <span class="col-type">TEXT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">created_at</span></span> <span class="col-type">TIMESTAMP DEFAULT NOW</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 3 & 4 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">3. warehouses</span>
        <span class="entity-cluster">Facilities</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">name</span></span> <span class="col-type">VARCHAR(150) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">code</span></span> <span class="col-type">VARCHAR(50) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">address</span></span> <span class="col-type">VARCHAR(255) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">city / state</span></span> <span class="col-type">VARCHAR(100) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">capacity</span></span> <span class="col-type">INT DEFAULT 10000</span></div>
        <div class="entity-col-row"><span><span class="col-name">is_active</span></span> <span class="col-type">TINYINT DEFAULT 1</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">4. storage_locations</span>
        <span class="entity-cluster">Facilities</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">zone / aisle</span></span> <span class="col-type">VARCHAR(50) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">rack / bin</span></span> <span class="col-type">VARCHAR(50) NULL</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">label</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">is_active</span></span> <span class="col-type">TINYINT DEFAULT 1</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 5 & 6 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">5. suppliers</span>
        <span class="entity-cluster">Procurement</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="col-name">name</span></span> <span class="col-type">VARCHAR(150) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">code</span></span> <span class="col-type">VARCHAR(50) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">contact_person</span></span> <span class="col-type">VARCHAR(150) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">email / phone</span></span> <span class="col-type">VARCHAR(191) / VARCHAR(50)</span></div>
        <div class="entity-col-row"><span><span class="col-name">is_active</span></span> <span class="col-type">TINYINT DEFAULT 1</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">6. products</span>
        <span class="entity-cluster">Catalog</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">sku</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">name</span></span> <span class="col-type">VARCHAR(255) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">category_id</span></span> <span class="col-type">INT NULL (categories.id)</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">barcode</span></span> <span class="col-type">VARCHAR(100) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">unit_cost</span></span> <span class="col-type">DECIMAL(10,2) DEFAULT 0.00</span></div>
        <div class="entity-col-row"><span><span class="col-name">reorder_threshold</span></span> <span class="col-type">INT DEFAULT 10</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 7 & 8 -->
  <div class="page-break"></div>
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">7. inventory</span>
        <span class="entity-cluster">Live Stock</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">location_id</span></span> <span class="col-type">INT NULL (storage_locations.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_on_hand</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="col-name">reserved_quantity</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="col-name">reorder_threshold</span></span> <span class="col-type">INT DEFAULT 10</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">Composite Key</span></span> <span class="col-type">(product_id, warehouse_id, location_id)</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">8. inventory_movements</span>
        <span class="entity-cluster">Ledger</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">location_id</span></span> <span class="col-type">INT NULL (storage_locations.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">movement_type</span></span> <span class="col-type">ENUM('receive','ship','adjust','transfer_in','transfer_out','reserve','release')</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">performed_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 9 & 10 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">9. orders</span>
        <span class="entity-cluster">Orders</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">order_number</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">customer_name</span></span> <span class="col-type">VARCHAR(255) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">ENUM('pending','confirmed','processing','partially_fulfilled','fulfilled','cancelled')</span></div>
        <div class="entity-col-row"><span><span class="col-name">priority</span></span> <span class="col-type">ENUM('low','normal','high','urgent')</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">created_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">order_date</span></span> <span class="col-type">TIMESTAMP DEFAULT NOW</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">10. order_items</span>
        <span class="entity-cluster">Orders</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">order_id</span></span> <span class="col-type">INT NOT NULL (orders.id CASCADE)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_ordered</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_fulfilled</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">unit_price</span></span> <span class="col-type">DECIMAL(10,2) DEFAULT 0.00</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 11 & 12 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">11. stock_reservations</span>
        <span class="entity-cluster">Allocation</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">order_id</span></span> <span class="col-type">INT NOT NULL (orders.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">order_item_id</span></span> <span class="col-type">INT NOT NULL (order_items.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">location_id</span></span> <span class="col-type">INT NULL (storage_locations.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">ENUM('active','fulfilled','released')</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">12. inbound_receipts</span>
        <span class="entity-cluster">Inbound</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">receipt_number</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">supplier_id</span></span> <span class="col-type">INT NULL (suppliers.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">ENUM('draft','in_progress','completed','cancelled')</span></div>
        <div class="entity-col-row"><span><span class="col-name">expected_date / received</span></span> <span class="col-type">DATE NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">created_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 13 & 14 -->
  <div class="page-break"></div>
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">13. receipt_items</span>
        <span class="entity-cluster">Inbound</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">receipt_id</span></span> <span class="col-type">INT NOT NULL (inbound_receipts.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">expected_quantity</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="col-name">received_quantity</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="col-name">damaged_quantity</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">location_id</span></span> <span class="col-type">INT NULL (storage_locations.id)</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">14. shipments</span>
        <span class="entity-cluster">Outbound</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-idx">UQ</span> <span class="col-name">shipment_number</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">order_id</span></span> <span class="col-type">INT NULL (orders.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">ENUM('draft','ready_to_pick','picking','packed','dispatched','delivered','cancelled')</span></div>
        <div class="entity-col-row"><span><span class="col-name">carrier / tracking</span></span> <span class="col-type">VARCHAR(100) NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">assigned_to</span></span> <span class="col-type">INT NULL (users.id)</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 15 & 16 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">15. shipment_items</span>
        <span class="entity-cluster">Outbound</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">shipment_id</span></span> <span class="col-type">INT NOT NULL (shipments.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_ordered</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_picked</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity_packed</span></span> <span class="col-type">INT NOT NULL DEFAULT 0</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">location_id</span></span> <span class="col-type">INT NULL (storage_locations.id)</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">16. shipment_status_events</span>
        <span class="entity-cluster">Outbound</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">shipment_id</span></span> <span class="col-type">INT NOT NULL (shipments.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">VARCHAR(50) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">notes</span></span> <span class="col-type">TEXT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">created_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">created_at</span></span> <span class="col-type">TIMESTAMP DEFAULT NOW</span></div>
      </div>
    </div>
  </div>

  <!-- TABLE 17, 18, 19, 20 -->
  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">17. stock_adjustments</span>
        <span class="entity-cluster">Stock Control</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">warehouse_id</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">adjustment_type</span></span> <span class="col-type">ENUM('count','damage','loss','found','correction')</span></div>
        <div class="entity-col-row"><span><span class="col-name">qty_before / after</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">performed_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">18. inventory_transfers</span>
        <span class="entity-cluster">Transfers</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">product_id</span></span> <span class="col-type">INT NOT NULL (products.id)</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">from_wh / to_wh</span></span> <span class="col-type">INT NOT NULL (warehouses.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">quantity</span></span> <span class="col-type">INT NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">status</span></span> <span class="col-type">ENUM('pending','completed','cancelled')</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">performed_by</span></span> <span class="col-type">INT NULL (users.id)</span></div>
      </div>
    </div>
  </div>

  <div class="er-grid">
    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">19. audit_log</span>
        <span class="entity-cluster">Auditing</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">id</span></span> <span class="col-type">INT AUTO_INCREMENT</span></div>
        <div class="entity-col-row"><span><span class="key-fk">FK</span> <span class="col-name">user_id</span></span> <span class="col-type">INT NULL (users.id)</span></div>
        <div class="entity-col-row"><span><span class="col-name">action</span></span> <span class="col-type">VARCHAR(100) NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">entity_type / entity_id</span></span> <span class="col-type">VARCHAR(100) / INT</span></div>
        <div class="entity-col-row"><span><span class="col-name">details</span></span> <span class="col-type">JSON NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">ip_address</span></span> <span class="col-type">VARCHAR(100) NULL</span></div>
        <div class="entity-col-row"><span><span class="col-name">created_at</span></span> <span class="col-type">TIMESTAMP DEFAULT NOW</span></div>
      </div>
    </div>

    <div class="entity-card">
      <div class="entity-header">
        <span class="entity-title">20. sessions</span>
        <span class="entity-cluster">Security</span>
      </div>
      <div class="entity-body">
        <div class="entity-col-row"><span><span class="key-pk">PK</span> <span class="col-name">sid</span></span> <span class="col-type">VARCHAR(128)</span></div>
        <div class="entity-col-row"><span><span class="col-name">sess</span></span> <span class="col-type">JSON NOT NULL</span></div>
        <div class="entity-col-row"><span><span class="key-idx">IDX</span> <span class="col-name">expired</span></span> <span class="col-type">BIGINT NOT NULL</span></div>
      </div>
    </div>
  </div>

  <!-- SECTION 5: CONCURRENCY & TRANSACTION FLOW -->
  <div class="page-break"></div>
  <h2>5. Concurrency Protection & Transaction Lifecycle</h2>
  <p>
    Warehouse operations run concurrently across multiple staff members picking, packing, and dispatching orders. To prevent double dispatch, ghost inventory, or negative stock balances, all state-changing endpoints execute under strict MySQL InnoDB transactions with exclusive row-level locking.
  </p>

  <div class="flow-box">
    <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Atomic Shipment Dispatch Execution Flow</div>
    <div class="flow-step">
      <div class="step-number">1</div>
      <div class="step-content">
        <div class="step-title">Transaction Initialization</div>
        <div class="step-desc"><span class="code-pill">START TRANSACTION</span> acquired on dedicated MySQL connection.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">2</div>
      <div class="step-content">
        <div class="step-title">Pessimistic Row Lock on Shipment</div>
        <div class="step-desc">Executes <span class="code-pill">SELECT * FROM shipments WHERE id = ? FOR UPDATE</span>. Any rival request blocks until lock resolution.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">3</div>
      <div class="step-content">
        <div class="step-title">Idempotency Validation</div>
        <div class="step-desc">Checks if status is already <span class="code-pill">dispatched</span> or <span class="code-pill">delivered</span>. If true, triggers immediate <span class="code-pill">ROLLBACK</span> and responds with <span class="code-pill">HTTP 409 Conflict</span> to prevent duplicate dispatch.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">4</div>
      <div class="step-content">
        <div class="step-title">Pessimistic Inventory Row Locks & Availability Check</div>
        <div class="step-desc">Executes <span class="code-pill">SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE</span>. Validates that <span class="code-pill">quantity_on_hand &gt;= shipped_qty</span>.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">5</div>
      <div class="step-content">
        <div class="step-title">Physical Balance Deductions & Reservation Clearance</div>
        <div class="step-desc">Decrements <span class="code-pill">quantity_on_hand -= shipped_qty</span> and releases corresponding <span class="code-pill">reserved_quantity</span>. Updates <span class="code-pill">stock_reservations</span> to <span class="code-pill">fulfilled</span>.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">6</div>
      <div class="step-content">
        <div class="step-title">Audit Trail & Movement Ledger Logging</div>
        <div class="step-desc">Inserts immutable row in <span class="code-pill">inventory_movements</span> with movement type <span class="code-pill">'ship'</span> and logs user action in <span class="code-pill">audit_log</span>.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-number">7</div>
      <div class="step-content">
        <div class="step-title">Atomic Commit</div>
        <div class="step-desc"><span class="code-pill">COMMIT</span> executed. All table changes become durable simultaneously; locks are released.</div>
      </div>
    </div>
  </div>

  <!-- SECTION 6: LOCAL DEPLOYMENT TOPOLOGY -->
  <h2>6. Offline Deployment Architecture & Port Bindings</h2>
  <p>
    The system is configured to launch and operate completely disconnected from external internet infrastructure. A single executable command script coordinates the 3-process architecture:
  </p>

  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Binding / Protocol</th>
        <th>Process Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>MySQL 8.0 Daemon</strong></td>
        <td><span class="code-pill">localhost:3306</span> &amp; <span class="code-pill">/tmp/mysql.sock</span></td>
        <td>Standalone local daemon storing tables in <span class="code-pill">data/mysql</span>. Managed via background process runner.</td>
      </tr>
      <tr>
        <td><strong>Express REST API</strong></td>
        <td><span class="code-pill">localhost:3001</span></td>
        <td>Node.js API server handling authentication, validation, queries, and transactions.</td>
      </tr>
      <tr>
        <td><strong>React Vite Client</strong></td>
        <td><span class="code-pill">localhost:5173</span></td>
        <td>Vite development/preview server serving the single-page application with proxying to port 3001.</td>
      </tr>
      <tr>
        <td><strong>Launcher Automation</strong></td>
        <td><span class="code-pill">WarehouseManager.command</span></td>
        <td>Native macOS executable located on Desktop and project root that initializes services and opens Google Chrome automatically.</td>
      </tr>
    </tbody>
  </table>

  <div class="doc-footer">
    <span>Warehouse Management System Architecture &amp; ER Specification</span>
    <span>Generated for Offline Reference &bull; October 2026</span>
  </div>

</body>
</html>
`;

// Write HTML file
fs.writeFileSync(HTML_OUTPUT_PATH, htmlContent, 'utf-8');
console.log('HTML documentation generated at:', HTML_OUTPUT_PATH);

// Compile to PDF using headless Chrome
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (fs.existsSync(CHROME_PATH)) {
  console.log('Compiling PDF using Google Chrome headless...');
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${PDF_DESKTOP_PATH}" "${HTML_OUTPUT_PATH}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('PDF successfully created on Desktop at:', PDF_DESKTOP_PATH);
    // Also copy to project directory
    fs.copyFileSync(PDF_DESKTOP_PATH, PDF_PROJECT_PATH);
    console.log('PDF copied to project folder at:', PDF_PROJECT_PATH);
  } catch (err) {
    console.error('Error compiling PDF:', err);
  }
} else {
  console.error('Chrome not found at', CHROME_PATH);
}
