import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import warehouseRoutes from './routes/warehouses';
import inventoryRoutes from './routes/inventory';
import receiptRoutes from './routes/receipts';
import orderRoutes from './routes/orders';
import shipmentRoutes from './routes/shipments';
import supplierRoutes from './routes/suppliers';
import dashboardRoutes from './routes/dashboard';
import auditRoutes from './routes/audit';

const app = express();
const PORT = process.env.PORT || 3001;

// Security and middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_warehouse_session_key_2026_enterprise',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
  },
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Warehouse Stock & Shipment Management API',
    database: 'MySQL 8.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    errors: err.errors,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Enterprise Warehouse Management Server running on port ${PORT}`);
  console.log(`Connected to MySQL: ${process.env.DB_NAME || 'warehouse_db'}`);
});

export default app;
