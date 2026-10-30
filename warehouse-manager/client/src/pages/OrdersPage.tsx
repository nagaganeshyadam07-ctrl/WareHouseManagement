import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../api/orders';
import { productsApi } from '../api/products';
import type { Order, OrderItem, Product } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const OrdersPage: React.FC = () => {
  const { canEdit } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Order details modal
  const [activeOrder, setActiveOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [availability, setAvailability] = useState<Record<string, { available: number; required: number; isAvailable: boolean }>>({});

  // Create Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [shipAddress, setShipAddress] = useState('');
  const [priority, setPriority] = useState<'normal' | 'low' | 'high' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: '1', quantity: 5, unitPrice: 34.99 },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Confirm / Cancel Action
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.list({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      });
      if (res) {
        setOrders(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, priorityFilter, search]);

  const loadOrderDetails = async (id: string) => {
    try {
      const order = await ordersApi.getById(id);
      setActiveOrder(order);

      // Check real-time stock availability
      const availRes = await ordersApi.checkAvailability(id);
      const availMap: Record<string, any> = {};
      availRes.items?.forEach((i) => {
        availMap[i.productId] = i;
      });
      setAvailability(availMap);
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    try {
      const prodRes = await productsApi.list({ pageSize: 50 });
      setAvailableProducts(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Order must have at least one line item');
      return;
    }

    setIsCreating(true);
    try {
      await ordersApi.create({
        customerName: custName,
        customerEmail: custEmail,
        customerPhone: custPhone,
        shippingAddress: shipAddress,
        priority,
        notes,
        items,
      });
      toast.success('Order placed successfully (Pending Allocation)');
      setIsCreateOpen(false);
      setCustName('');
      setCustEmail('');
      setShipAddress('');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!activeOrder) return;
    setIsConfirming(true);
    try {
      await ordersApi.confirm(activeOrder.id);
      toast.success('Order confirmed & inventory reserved successfully!');
      loadOrderDetails(activeOrder.id);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Validation failed: insufficient stock to confirm order');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    setIsCancelling(true);
    try {
      await ordersApi.cancel(activeOrder.id, cancelReason);
      toast.success('Order cancelled and reserved stock released');
      setCancelModalOpen(false);
      loadOrderDetails(activeOrder.id);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (r) => (
        <button
          onClick={() => loadOrderDetails(r.id)}
          className="font-mono font-medium text-[#1a73e8] hover:underline text-left"
        >
          {r.orderNumber}
        </button>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (r) => (
        <div>
          <div className="font-medium text-[#202124]">{r.customerName}</div>
          <div className="text-[10px] text-[#5f6368]">{r.customerEmail}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <StatusBadge status={r.priority} size="sm" />,
    },
    {
      key: 'itemsCount',
      header: 'Lines',
      align: 'center',
      render: (r) => <span className="font-medium">{r.itemsCount}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      align: 'right',
      render: (r) => <span className="font-semibold">${Number(r.totalAmount || 0).toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Order Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button variant="secondary" size="sm" onClick={() => loadOrderDetails(r.id)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Orders &amp; Stock Reservations</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Customer order lifecycle, safe multi-warehouse stock reservation, and fulfillment readiness.
          </p>
        </div>
        {canEdit() && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Create Customer Order
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order number or customer name..."
          className="min-w-[240px] flex-1 rounded border border-[#dadce0] py-1.5 px-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
        >
          <option value="">All Order Statuses</option>
          <option value="pending">Pending (Awaiting Allocation)</option>
          <option value="confirmed">Confirmed (Stock Reserved)</option>
          <option value="processing">Processing (In Picking)</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Order Detail Modal */}
      {activeOrder && (
        <Modal
          isOpen={!!activeOrder}
          onClose={() => setActiveOrder(null)}
          title={`Order: ${activeOrder.orderNumber}`}
          description={`Customer: ${activeOrder.customerName} | Status: ${activeOrder.status.toUpperCase()}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeOrder.status} size="md" />
                <StatusBadge status={activeOrder.priority} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveOrder(null)}>
                  Close
                </Button>
                {canEdit() && activeOrder.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmOrder}
                    isLoading={isConfirming}
                    icon={<CheckBadgeIcon className="h-4 w-4" />}
                  >
                    Confirm &amp; Reserve Inventory
                  </Button>
                )}
                {canEdit() && activeOrder.status !== 'fulfilled' && activeOrder.status !== 'cancelled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelModalOpen(true)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Customer & Shipping info */}
            <div className="grid grid-cols-2 gap-3 bg-[#f8f9fa] p-3 rounded border border-[#e8eaed] text-xs">
              <div>
                <span className="text-[#5f6368] block">Customer Contact:</span>
                <span className="font-semibold text-[#202124] block">{activeOrder.customerName}</span>
                <span className="text-[#5f6368]">{activeOrder.customerEmail} &bull; {activeOrder.customerPhone || 'No phone'}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Ship To Address:</span>
                <span className="text-[#202124] block leading-tight">{activeOrder.shippingAddress}</span>
              </div>
            </div>

            {/* Line Items & Stock Availability */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase text-[#3c4043] tracking-wider">
                  Ordered Items &amp; Stock Availability Check
                </h4>
                <span className="text-[11px] text-[#5f6368]">
                  Total Order Value: <span className="font-bold text-[#202124]">${activeOrder.totalAmount?.toFixed(2)}</span>
                </span>
              </div>

              <div className="border border-[#dadce0] rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368]">
                      <th className="p-2.5 font-medium">SKU / Product</th>
                      <th className="p-2.5 font-medium text-center">Qty Ordered</th>
                      <th className="p-2.5 font-medium text-center">Unit Price</th>
                      <th className="p-2.5 font-medium text-center">Total</th>
                      <th className="p-2.5 font-medium text-center">Stock Check</th>
                      <th className="p-2.5 font-medium">Reservation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eaed]">
                    {activeOrder.items?.map((item) => {
                      const avail = availability[item.productId];
                      const isAvailable = avail ? avail.isAvailable : item.availableStock >= item.quantityOrdered;

                      return (
                        <tr key={item.id} className="hover:bg-[#f8f9fa]">
                          <td className="p-2.5">
                            <div className="font-mono font-medium text-[#1a73e8]">{item.sku}</div>
                            <div className="text-[11px] text-[#202124] truncate max-w-xs">{item.productName}</div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#202124]">
                            {item.quantityOrdered}
                          </td>
                          <td className="p-2.5 text-center text-[#5f6368]">
                            ${item.unitPrice?.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center font-semibold text-[#202124]">
                            ${(item.quantityOrdered * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            {isAvailable ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircleIcon className="h-3 w-3" /> In Stock ({avail?.available ?? item.availableStock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <ExclamationCircleIcon className="h-3 w-3" /> Shortage (Avail: {avail?.available ?? item.availableStock})
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {activeOrder.notes && (
              <div className="text-xs text-[#5f6368] bg-[#f8f9fa] p-2.5 rounded border border-[#e8eaed]">
                <span className="font-medium text-[#3c4043] block">Special Instructions:</span>
                {activeOrder.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Order"
        description="Book customer order and validate line items against real-time stock."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubmit} isLoading={isCreating}>
              Submit Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer Name" required>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Acme Logistics Corp"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>

            <FormField label="Priority Level">
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority (Expedited)</option>
                <option value="low">Low Priority</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer Email">
              <input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="procure@customer.com"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>

            <FormField label="Customer Phone">
              <input
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
          </div>

          <FormField label="Shipping Address" required>
            <input
              type="text"
              value={shipAddress}
              onChange={(e) => setShipAddress(e.target.value)}
              placeholder="e.g. 500 Commerce Park Blvd, Dallas, TX 75201"
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              required
            />
          </FormField>

          {/* Line Items */}
          <div className="space-y-2 border-t border-[#e8eaed] pt-3">
            <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider">
              Order Line Items
            </label>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx].productId = e.target.value;
                    const prod = availableProducts.find((p) => p.id === e.target.value);
                    if (prod) updated[idx].unitPrice = prod.unitCost ? prod.unitCost * 1.3 : 19.99;
                    setItems(updated);
                  }}
                  className="flex-1 rounded border border-[#dadce0] px-2 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                    setItems(updated);
                  }}
                  className="w-16 rounded border border-[#dadce0] px-2 py-1.5 text-xs text-center text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                  placeholder="Qty"
                />

                <span className="text-xs text-[#5f6368] font-mono">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setItems([...items, { productId: availableProducts[0]?.id || '1', quantity: 2, unitPrice: 24.99 }])}
            >
              + Add Item Line
            </Button>
          </div>

          <FormField label="Internal Fulfillment Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              placeholder="Dock appointment instructions..."
            />
          </FormField>
        </form>
      </Modal>

      {/* Cancel Order Confirm */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order?"
        description="Cancelling this order will release all reserved stock back to available warehouse inventory."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
              Keep Order
            </Button>
            <Button variant="danger" size="sm" onClick={handleCancelOrder} isLoading={isCancelling}>
              Cancel Order &amp; Release Stock
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-[#3c4043]">Please provide a cancellation reason for the audit trail:</p>
          <FormField label="Cancellation Reason" required>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              required
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};
