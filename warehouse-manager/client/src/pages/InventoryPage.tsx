import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { inventoryApi } from '../api/inventory';
import type { InventoryItem, StockMovement } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const InventoryPage: React.FC = () => {
  const { selectedWarehouse } = useOutletContext<{ selectedWarehouse: string }>();
  const { canEdit } = useAuth();

  // Tab mode
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Inventory Table State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('sku');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // Movements State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Adjust Form
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('correction');
  const [adjustReason, setAdjustReason] = useState('Physical cycle count discrepancy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transfer Form
  const [transferTargetWh, setTransferTargetWh] = useState('2');
  const [transferQty, setTransferQty] = useState('5');
  const [transferNotes, setTransferNotes] = useState('Rebalancing regional distribution stock');

  // Fetch Inventory items
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await inventoryApi.list({
        page,
        pageSize,
        search: search || undefined,
        warehouseId: selectedWarehouse || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortDirection,
      });

      if (res) {
        setItems(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err: any) {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Movements
  const fetchMovements = async () => {
    setIsMovementsLoading(true);
    try {
      const res = await inventoryApi.getMovements({
        page: movementsPage,
        pageSize: 20,
        warehouseId: selectedWarehouse || undefined,
      });
      if (res) {
        setMovements(res.data || []);
        setMovementsTotal(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load movements');
    } finally {
      setIsMovementsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, selectedWarehouse]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else {
      fetchMovements();
    }
  }, [activeTab, page, movementsPage, search, statusFilter, categoryFilter, selectedWarehouse, sortBy, sortDirection]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQty('');
    setAdjustReason('Physical cycle count verification');
    setIsAdjustOpen(true);
  };

  const handleOpenTransfer = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransferQty('5');
    // Default to another warehouse
    const otherWh = item.warehouseId === '1' ? '2' : '1';
    setTransferTargetWh(otherWh);
    setIsTransferOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error('Please specify a non-zero adjustment quantity (+/-)');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.adjustStock({
        productId: selectedItem.productId,
        warehouseId: selectedItem.warehouseId,
        quantity: qty,
        reason: adjustReason,
        notes: `Adjustment type: ${adjustType}`,
      });
      toast.success(`Stock adjusted by ${qty > 0 ? `+${qty}` : qty} units`);
      setIsAdjustOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseInt(transferQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid transfer quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.transferStock({
        productId: selectedItem.productId,
        fromWarehouseId: selectedItem.warehouseId,
        toWarehouseId: transferTargetWh,
        quantity: qty,
        notes: transferNotes,
      });
      toast.success(`Successfully transferred ${qty} units`);
      setIsTransferOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/inventory/export', '_blank');
  };

  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-medium text-[#1a73e8]">{r.sku}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product Name',
      sortable: true,
      render: (r) => (
        <div className="max-w-xs">
          <div className="font-medium text-[#202124] truncate">{r.productName}</div>
          <div className="text-[10px] text-[#5f6368]">{r.category}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-[#3c4043]">{r.warehouseName}</span>
      ),
    },
    {
      key: 'locationCode',
      header: 'Location Code',
      render: (r) => (
        <span className="font-mono text-[11px] text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {r.locationCode}
        </span>
      ),
    },
    {
      key: 'onHand',
      header: 'On Hand',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-[#202124]">{r.onHand.toLocaleString()}</span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      render: (r) => (
        <span className={r.reserved > 0 ? 'text-amber-700 font-medium' : 'text-[#80868b]'}>
          {r.reserved}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      render: (r) => (
        <span className="font-medium text-[#202124]">{r.available.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {canEdit() && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenAdjust(r)}
                title="Adjust Stock Quantity"
              >
                Adjust
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenTransfer(r)}
                title="Transfer to Facility"
                disabled={r.available <= 0}
              >
                Transfer
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const movementsColumns: Column<StockMovement>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => (
        <span className="text-[11px] text-[#5f6368]">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (r) => (
        <span className="font-mono font-medium text-[#1a73e8]">{r.sku}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      render: (r) => (
        <span className="truncate max-w-xs block font-medium">{r.productName}</span>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (r) => <span>{r.warehouseName}</span>,
    },
    {
      key: 'type',
      header: 'Movement Type',
      render: (r) => <StatusBadge status={r.type} size="sm" />,
    },
    {
      key: 'quantity',
      header: 'Quantity Shift',
      align: 'right',
      render: (r) => {
        const isPositive = r.type === 'receipt' || r.type === 'transfer_in';
        return (
          <span className={`font-mono font-semibold ${isPositive ? 'text-emerald-700' : 'text-slate-700'}`}>
            {isPositive ? `+${r.quantity}` : `-${r.quantity}`}
          </span>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (r) => <span className="text-xs text-[#5f6368]">{r.reference}</span>,
    },
    {
      key: 'performedBy',
      header: 'Operator',
      render: (r) => <span className="text-xs font-medium">{r.performedBy}</span>,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (r) => <span className="text-xs text-[#5f6368] italic truncate max-w-xs">{r.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Inventory & Stock Management</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Real-time multi-warehouse inventory levels, SKU allocations, and verifiable movement logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex rounded-md border border-[#dadce0] bg-[#f8f9fa] p-0.5">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-[#1a73e8] shadow-xs' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
              Stock Table
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${activeTab === 'movements' ? 'bg-white text-[#1a73e8] shadow-xs' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              Movement Log
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            icon={<ArrowDownTrayIcon className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1">
              <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5f6368]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, name, barcode, location..."
                className="w-full rounded border border-[#dadce0] py-1.5 pl-8 pr-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; Threshold)</option>
              <option value="low_stock">Low Stock (≤ Threshold)</option>
              <option value="out_of_stock">Out of Stock (0 On Hand)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Industrial">Industrial</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Automotive">Automotive</option>
            </select>
          </div>

          {/* Compact Data Table */}
          <DataTable
            columns={inventoryColumns}
            data={items}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            onPageChange={(p) => setPage(p)}
          />
        </>
      ) : (
        <DataTable
          columns={movementsColumns}
          data={movements}
          isLoading={isMovementsLoading}
          page={movementsPage}
          pageSize={20}
          total={movementsTotal}
          onPageChange={(p) => setMovementsPage(p)}
        />
      )}

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <Modal
          isOpen={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          title={`Adjust Stock — ${selectedItem.sku}`}
          description={`Product: ${selectedItem.productName} at ${selectedItem.warehouseName}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAdjustOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAdjustSubmit} isLoading={isSubmitting}>
                Apply Adjustment
              </Button>
            </>
          }
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2 bg-[#f8f9fa] p-3 rounded border border-[#e8eaed] text-center text-xs">
              <div>
                <span className="text-[#5f6368] block">Current On Hand</span>
                <span className="font-semibold text-sm text-[#202124]">{selectedItem.onHand}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Reserved</span>
                <span className="font-semibold text-sm text-amber-700">{selectedItem.reserved}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Available</span>
                <span className="font-semibold text-sm text-[#1a73e8]">{selectedItem.available}</span>
              </div>
            </div>

            <FormField label="Adjustment Quantity Delta (+ / -)" required helpText="Enter a positive number to add stock, negative to reduce.">
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. +10 or -5"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>

            <FormField label="Adjustment Classification" required>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              >
                <option value="correction">Count Correction (Cycle audit)</option>
                <option value="damage">Damaged Goods (Scrap)</option>
                <option value="loss">Loss / Shrinkage</option>
                <option value="found">Found Inventory / Inbound discrepancy</option>
              </select>
            </FormField>

            <FormField label="Reason & Audit Explanation" required>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={2}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>
          </form>
        </Modal>
      )}

      {/* Stock Transfer Modal */}
      {selectedItem && (
        <Modal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          title={`Inter-Facility Transfer — ${selectedItem.sku}`}
          description={`Transfer stock from ${selectedItem.warehouseName} to another facility.`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsTransferOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleTransferSubmit} isLoading={isSubmitting}>
                Execute Transfer
              </Button>
            </>
          }
        >
          <form onSubmit={handleTransferSubmit} className="space-y-3.5">
            <div className="bg-[#f8f9fa] p-3 rounded border border-[#e8eaed] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Source Facility:</span>
                <span className="font-semibold text-[#202124]">{selectedItem.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6368]">Available to Transfer:</span>
                <span className="font-semibold text-[#1a73e8]">{selectedItem.available} units</span>
              </div>
            </div>

            <FormField label="Destination Facility" required>
              <select
                value={transferTargetWh}
                onChange={(e) => setTransferTargetWh(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              >
                {selectedItem.warehouseId !== '1' && <option value="1">WH-001 (Main Hub, Dallas)</option>}
                {selectedItem.warehouseId !== '2' && <option value="2">WH-002 (East DC, Atlanta)</option>}
                {selectedItem.warehouseId !== '3' && <option value="3">WH-003 (West Logistics, Portland)</option>}
              </select>
            </FormField>

            <FormField label="Transfer Quantity" required>
              <input
                type="number"
                min="1"
                max={selectedItem.available}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>

            <FormField label="Transfer Notes / Authorization" required>
              <input
                type="text"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>
          </form>
        </Modal>
      )}
    </div>
  );
};
