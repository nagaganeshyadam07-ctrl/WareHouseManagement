import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { receiptsApi } from '../api/receipts';
import { suppliersApi } from '../api/suppliers';
import { productsApi } from '../api/products';
import type { Receipt, ReceiptItem, Supplier, Product } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const ReceivingPage: React.FC = () => {
  const { selectedWarehouse } = useOutletContext<{ selectedWarehouse: string }>();
  const { canEdit } = useAuth();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected receipt for detail drawer
  const [activeReceipt, setActiveReceipt] = useState<(Receipt & { items: ReceiptItem[] }) | null>(null);

  // Create Receipt Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [newWh, setNewWh] = useState('1');
  const [newSup, setNewSup] = useState('');
  const [newExpectedDate, setNewExpectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [newItems, setNewItems] = useState<{ productId: string; expectedQuantity: number }[]>([
    { productId: '1', expectedQuantity: 50 },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Complete Confirmation Dialog
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await receiptsApi.list({
        page,
        pageSize: 20,
        warehouseId: selectedWarehouse || undefined,
        status: statusFilter || undefined,
      });
      if (res) {
        setReceipts(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load inbound receipts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, statusFilter, selectedWarehouse]);

  const loadReceiptDetails = async (id: string) => {
    try {
      const data = await receiptsApi.getById(id);
      setActiveReceipt(data);
    } catch (err) {
      toast.error('Failed to load receipt details');
    }
  };

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    try {
      const [supRes, prodRes] = await Promise.all([
        suppliersApi.list(),
        productsApi.list({ pageSize: 50 }),
      ]);
      setSuppliers(supRes.data || []);
      if (supRes.data && supRes.data.length > 0) setNewSup(supRes.data[0].id);
      setAvailableProducts(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItems.length === 0) {
      toast.error('Add at least one line item');
      return;
    }

    setIsCreating(true);
    try {
      await receiptsApi.create({
        supplierId: newSup,
        warehouseId: newWh,
        expectedDate: newExpectedDate,
        notes: newNotes,
        items: newItems,
      });
      toast.success('Inbound receipt created successfully');
      setIsCreateOpen(false);
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create receipt');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateItemQty = async (itemId: string, newQty: number) => {
    if (!activeReceipt) return;
    try {
      await receiptsApi.updateItem(activeReceipt.id, itemId, { receivedQuantity: newQty });
      toast.success('Received count recorded');
      loadReceiptDetails(activeReceipt.id);
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item count');
    }
  };

  const handleCompleteReceipt = async () => {
    if (!activeReceipt) return;
    setIsCompleting(true);
    try {
      await receiptsApi.complete(activeReceipt.id);
      toast.success('Receipt completed! Warehouse stock updated successfully.');
      setIsCompleteOpen(false);
      loadReceiptDetails(activeReceipt.id);
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete receipt');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!activeReceipt) return;
    try {
      await receiptsApi.cancel(activeReceipt.id);
      toast.success('Receipt cancelled');
      loadReceiptDetails(activeReceipt.id);
      fetchReceipts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel receipt');
    }
  };

  const columns: Column<Receipt>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      render: (r) => (
        <button
          onClick={() => loadReceiptDetails(r.id)}
          className="font-mono font-medium text-[#1a73e8] hover:underline text-left"
        >
          {r.receiptNumber}
        </button>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (r) => <span className="font-medium text-[#202124]">{r.supplierName}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Facility',
      render: (r) => <span className="text-xs text-[#3c4043]">{r.warehouseName}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Expected Arrival',
      render: (r) => <span className="text-xs text-[#5f6368]">{r.expectedDate || '—'}</span>,
    },
    {
      key: 'itemsCount',
      header: 'Lines',
      align: 'right',
      render: (r) => <span className="font-semibold text-[#202124]">{r.itemsCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadReceiptDetails(r.id)}
        >
          View Intake
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Inbound Receiving</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Manage vendor deliveries, advance shipping notices (ASNs), and physical dock intake verification.
          </p>
        </div>
        {canEdit() && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Create Inbound Receipt
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
          >
            <option value="">All Receiving Statuses</option>
            <option value="draft">Draft (Awaiting Arrival)</option>
            <option value="in_progress">In Progress (Unloading at Dock)</option>
            <option value="completed">Completed (Stock Credited)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="text-xs text-[#5f6368]">
          Total PO Receipts: <span className="font-semibold text-[#202124]">{total}</span>
        </div>
      </div>

      {/* Receipts Table */}
      <DataTable
        columns={columns}
        data={receipts}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Receipt Details Modal */}
      {activeReceipt && (
        <Modal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title={`Inbound Receipt: ${activeReceipt.receiptNumber}`}
          description={`Facility: ${activeReceipt.warehouseName} | Vendor: ${activeReceipt.supplierName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                <StatusBadge status={activeReceipt.status} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveReceipt(null)}>
                  Close
                </Button>
                {canEdit() && activeReceipt.status !== 'completed' && activeReceipt.status !== 'cancelled' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelReceipt}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Cancel PO
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCompleteOpen(true)}
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      Complete &amp; Credit Inventory
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Meta info */}
            <div className="grid grid-cols-3 gap-3 bg-[#f8f9fa] p-3 rounded border border-[#e8eaed] text-xs">
              <div>
                <span className="text-[#5f6368] block">Expected Arrival:</span>
                <span className="font-medium text-[#202124]">{activeReceipt.expectedDate || 'None specified'}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Actual Received Date:</span>
                <span className="font-medium text-[#202124]">{activeReceipt.receivedDate || 'Pending intake'}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Created By:</span>
                <span className="font-medium text-[#202124]">{activeReceipt.createdBy}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase text-[#3c4043] tracking-wider">
                  Intake Line Items ({activeReceipt.items?.length || 0})
                </h4>
                <span className="text-[11px] text-[#5f6368]">
                  Confirm counts before completing receipt
                </span>
              </div>

              <div className="border border-[#dadce0] rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368]">
                      <th className="p-2.5 font-medium">SKU / Item</th>
                      <th className="p-2.5 font-medium text-center">Expected</th>
                      <th className="p-2.5 font-medium text-center">Received</th>
                      <th className="p-2.5 font-medium">Putaway Bay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eaed]">
                    {activeReceipt.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9fa]">
                        <td className="p-2.5">
                          <div className="font-mono font-medium text-[#1a73e8]">{item.sku}</div>
                          <div className="text-[11px] text-[#202124] truncate max-w-xs">{item.productName}</div>
                        </td>
                        <td className="p-2.5 text-center font-medium text-[#5f6368]">
                          {item.expectedQuantity}
                        </td>
                        <td className="p-2.5 text-center">
                          {activeReceipt.status === 'completed' || !canEdit() ? (
                            <span className="font-bold text-[#202124]">{item.receivedQuantity}</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              defaultValue={item.receivedQuantity > 0 ? item.receivedQuantity : item.expectedQuantity}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== item.receivedQuantity) {
                                  handleUpdateItemQty(item.id, val);
                                }
                              }}
                              className="w-16 text-center border border-[#dadce0] rounded py-1 text-xs font-semibold focus:border-[#1a73e8] focus:outline-none"
                            />
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-[#5f6368]">
                          {item.locationCode || 'Receiving Bay'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {activeReceipt.notes && (
              <div className="text-xs text-[#5f6368] bg-[#f8f9fa] p-2.5 rounded border border-[#e8eaed]">
                <span className="font-medium text-[#3c4043] block">Intake Notes:</span>
                {activeReceipt.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Inbound Receipt Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Inbound Receipt / ASN"
        description="Schedule incoming vendor delivery and define expected line items."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubmit} isLoading={isCreating}>
              Save Inbound PO
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Vendor / Supplier" required>
              <select
                value={newSup}
                onChange={(e) => setNewSup(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </FormField>

            <FormField label="Target Facility" required>
              <select
                value={newWh}
                onChange={(e) => setNewWh(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              >
                <option value="1">WH-001 (Main Hub, Dallas)</option>
                <option value="2">WH-002 (East DC, Atlanta)</option>
                <option value="3">WH-003 (West Logistics, Portland)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Expected Delivery Date" required>
            <input
              type="date"
              value={newExpectedDate}
              onChange={(e) => setNewExpectedDate(e.target.value)}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              required
            />
          </FormField>

          {/* Line items selector */}
          <div className="space-y-2 border-t border-[#e8eaed] pt-3">
            <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider">
              Line Items
            </label>
            {newItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const updated = [...newItems];
                    updated[idx].productId = e.target.value;
                    setNewItems(updated);
                  }}
                  className="flex-1 rounded border border-[#dadce0] px-2 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.expectedQuantity}
                  onChange={(e) => {
                    const updated = [...newItems];
                    updated[idx].expectedQuantity = parseInt(e.target.value, 10) || 1;
                    setNewItems(updated);
                  }}
                  className="w-20 rounded border border-[#dadce0] px-2 py-1.5 text-xs text-center text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                  placeholder="Qty"
                />

                {newItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
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
              onClick={() => setNewItems([...newItems, { productId: availableProducts[0]?.id || '1', expectedQuantity: 25 }])}
            >
              + Add Another Line Item
            </Button>
          </div>

          <FormField label="Notes & Carrier Tracking">
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              placeholder="e.g. Inbound PO #4409 via FedEx Freight"
            />
          </FormField>
        </form>
      </Modal>

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        onConfirm={handleCompleteReceipt}
        title="Complete Inbound Receipt?"
        message="This operation will verify verified line items and automatically increment the warehouse stock on hand in a protected MySQL transaction."
        confirmLabel="Verify & Credit Stock"
        isLoading={isCompleting}
      />
    </div>
  );
};
