// ===== Common Types =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

// ===== Auth Types =====
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ===== Product Types =====
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  barcode: string;
  unitOfMeasure: string;
  weight?: number;
  dimensions?: string;
  reorderThreshold: number;
  reorderQuantity: number;
  unitCost: number;
  status: 'active' | 'archived' | 'discontinued';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category: string;
  barcode: string;
  unitOfMeasure: string;
  weight?: number;
  dimensions?: string;
  reorderThreshold: number;
  reorderQuantity: number;
  unitCost: number;
  status: 'active' | 'archived' | 'discontinued';
}

// ===== Inventory Types =====
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  locationCode: string;
  onHand: number;
  reserved: number;
  available: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export interface StockAdjustment {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockTransfer {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  warehouseId: string;
  warehouseName: string;
  type: 'receipt' | 'shipment' | 'adjustment' | 'transfer_in' | 'transfer_out';
  quantity: number;
  reference: string;
  performedBy: string;
  createdAt: string;
  notes?: string;
}

// ===== Warehouse Types =====
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  capacity: number;
  currentUtilization: number;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  locationsCount: number;
  createdAt: string;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  code: string;
  label?: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf?: string;
  bin: string;
  type?: 'storage' | 'receiving' | 'shipping' | 'staging';
  capacity?: number;
  currentItems: number;
  status: 'active' | 'inactive' | 'full';
}

export interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  capacity: number;
  status: 'active' | 'inactive';
}

// ===== Supplier Types =====
export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: 'active' | 'inactive';
  productsCount: number;
  createdAt: string;
}

export interface SupplierFormData {
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: 'active' | 'inactive';
}

// ===== Receipt Types =====
export interface Receipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  expectedDate: string;
  receivedDate?: string;
  itemsCount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  productId: string;
  productName: string;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  locationCode?: string;
  notes?: string;
}

export interface ReceiptFormData {
  supplierId: string;
  warehouseId: string;
  expectedDate: string;
  notes?: string;
  items: {
    productId: string;
    expectedQuantity: number;
  }[];
}

// ===== Order Types =====
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  status: 'pending' | 'draft' | 'confirmed' | 'processing' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  itemsCount: number;
  totalAmount: number;
  shipmentsCount: number;
  notes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityFulfilled: number;
  unitPrice: number;
  availableStock: number;
  status: 'pending' | 'reserved' | 'fulfilled' | 'cancelled';
}

export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// ===== Shipment Types =====
export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientAddress: string;
  warehouseId: string;
  warehouseName: string;
  carrier: string;
  trackingNumber?: string;
  status: 'draft' | 'ready_to_pick' | 'picking' | 'packed' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  shipDate?: string;
  deliveryDate?: string;
  itemsCount: number;
  weight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityPicked: number;
  quantityPacked: number;
  locationCode: string;
}

export interface ShipmentFormData {
  orderId: string;
  warehouseId: string;
  carrier: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

// ===== Dashboard Types =====
export interface DashboardStats {
  totalProducts: number;
  unitsInStock: number;
  lowStockItems: number;
  pendingReceipts: number;
  shipmentsAwaitingDispatch: number;
  ordersAwaitingFulfillment: number;
}

export interface StatChange {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
}

export interface ShipmentStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface StockTrend {
  date: string;
  totalStock: number;
  received: number;
  shipped: number;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  type: 'low_stock' | 'pending_receipt' | 'overdue_shipment' | 'cancelled_order';
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  createdAt: string;
}

// ===== Report Types =====
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  category?: string;
  supplierId?: string;
  status?: string;
}

export interface LowStockReportItem {
  productId: string;
  sku: string;
  productName: string;
  category: string;
  warehouseName: string;
  onHand: number;
  reorderThreshold: number;
  reorderQuantity: number;
  deficit: number;
}

// ===== Audit Log Types =====
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

// ===== Settings Types =====
export interface UserProfile {
  fullName: string;
  email: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}
