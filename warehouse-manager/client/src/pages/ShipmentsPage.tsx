import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  TruckIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { shipmentsApi } from '../api/shipments';
import { ordersApi } from '../api/orders';
import type { Shipment, ShipmentItem, Order } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const ShipmentsPage: React.FC = () => {
  const { selectedWarehouse } = useOutletContext<{ selectedWarehouse: string }>();
  const { canEdit } = useAuth();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Shipment Detail
  const [activeShipment, setActiveShipment] = useState<(Shipment & { items: ShipmentItem[]; timeline?: any[] }) | null>(null);

  // Modals
  const [isPickListOpen, setIsPickListOpen] = useState(false);
  const [pickListData, setPickListData] = useState<any>(null);

  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);
  const [packingSlipData, setPackingSlipData] = useState<any>(null);

  // Dispatch Confirmation & Concurrency protection
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTracking, setDispatchTracking] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Create Shipment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [carrier, setCarrier] = useState('FedEx Ground');
  const [isCreating, setIsCreating] = useState(false);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const res = await shipmentsApi.list({
        page,
        pageSize: 20,
        warehouseId: selectedWarehouse || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      if (res) {
        setShipments(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load shipments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, statusFilter, selectedWarehouse, search]);

  const loadShipmentDetails = async (id: string) => {
    try {
      const data = await shipmentsApi.getById(id);
      setActiveShipment(data);
    } catch (err) {
      toast.error('Failed to load shipment details');
    }
  };

  const handleStartPicking = async () => {
    if (!activeShipment) return;
    try {
      await shipmentsApi.startPicking(activeShipment.id);
      toast.success('Picking workflow initiated');
      loadShipmentDetails(activeShipment.id);
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start picking');
    }
  };

  const handleConfirmPacked = async () => {
    if (!activeShipment) return;
    try {
      await shipmentsApi.confirmPacked(activeShipment.id, []);
      toast.success('All items verified and confirmed packed');
      loadShipmentDetails(activeShipment.id);
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to pack shipment');
    }
  };

  const handleOpenDispatch = () => {
    if (!activeShipment) return;
    setDispatchTracking(activeShipment.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!activeShipment) return;
    setIsDispatching(true);
    try {
      await shipmentsApi.dispatch(activeShipment.id, dispatchTracking);
      toast.success(`Shipment ${activeShipment.shipmentNumber} dispatched! Inventory deducted.`);
      setIsDispatchModalOpen(false);
      loadShipmentDetails(activeShipment.id);
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || 'Dispatch failed');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!activeShipment) return;
    try {
      await shipmentsApi.markDelivered(activeShipment.id);
      toast.success('Shipment marked as delivered');
      loadShipmentDetails(activeShipment.id);
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update delivery');
    }
  };

  const handleViewPickList = async (id: string) => {
    try {
      const data = await shipmentsApi.getPickList(id);
      setPickListData(data);
      setIsPickListOpen(true);
    } catch (err) {
      toast.error('Failed to load pick list');
    }
  };

  const handleViewPackingSlip = async (id: string) => {
    try {
      const data = await shipmentsApi.getPackingSlip(id);
      setPackingSlipData(data);
      setIsPackingSlipOpen(true);
    } catch (err) {
      toast.error('Failed to load packing slip');
    }
  };

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    try {
      const res = await ordersApi.list({ status: 'confirmed' });
      setConfirmedOrders(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedOrder(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error('Please select an order to fulfill');
      return;
    }

    setIsCreating(true);
    try {
      const order = await ordersApi.getById(selectedOrder);
      const items = order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantityOrdered,
      }));

      await shipmentsApi.create({
        orderId: selectedOrder,
        warehouseId: selectedWarehouse || '1',
        carrier,
        items,
      });

      toast.success('Shipment created and queued for picking');
      setIsCreateOpen(false);
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment');
    } finally {
      setIsCreating(false);
    }
  };

  const columns: Column<Shipment>[] = [
    {
      key: 'shipmentNumber',
      header: 'Shipment #',
      render: (r) => (
        <button
          onClick={() => loadShipmentDetails(r.id)}
          className="font-mono font-medium text-[#1a73e8] hover:underline text-left"
        >
          {r.shipmentNumber}
        </button>
      ),
    },
    {
      key: 'orderNumber',
      header: 'Order Reference',
      render: (r) => <span className="font-mono text-xs text-[#5f6368]">{r.orderNumber}</span>,
    },
    {
      key: 'recipientName',
      header: 'Recipient',
      render: (r) => (
        <div>
          <div className="font-medium text-[#202124]">{r.recipientName}</div>
          <div className="text-[10px] text-[#5f6368] truncate max-w-xs">{r.recipientAddress}</div>
        </div>
      ),
    },
    {
      key: 'carrier',
      header: 'Carrier',
      render: (r) => (
        <div>
          <div className="text-xs text-[#202124]">{r.carrier}</div>
          <div className="font-mono text-[10px] text-[#5f6368]">{r.trackingNumber || 'Unassigned'}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Fulfillment Origin',
      render: (r) => <span className="text-xs text-[#3c4043]">{r.warehouseName}</span>,
    },
    {
      key: 'status',
      header: 'Pipeline State',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewPickList(r.id)}
            title="Print Pick List"
            icon={<DocumentTextIcon className="h-3.5 w-3.5" />}
          >
            Pick List
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadShipmentDetails(r.id)}
          >
            Fulfill
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Shipments &amp; Fulfillment Pipeline</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Sequential pick &rarr; pack &rarr; dispatch workflow with concurrency protection against duplicate inventory deductions.
          </p>
        </div>
        {canEdit() && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Generate Shipment
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shipment #, tracking, recipient..."
          className="min-w-[240px] flex-1 rounded border border-[#dadce0] py-1.5 px-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
        >
          <option value="">All Pipeline States</option>
          <option value="ready_to_pick">Ready to Pick</option>
          <option value="picking">Picking</option>
          <option value="packed">Packed</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Shipment Table */}
      <DataTable
        columns={columns}
        data={shipments}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Shipment Fulfillment Drawer / Modal */}
      {activeShipment && (
        <Modal
          isOpen={!!activeShipment}
          onClose={() => setActiveShipment(null)}
          title={`Fulfillment Pipeline: ${activeShipment.shipmentNumber}`}
          description={`Order: ${activeShipment.orderNumber} | Facility: ${activeShipment.warehouseName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeShipment.status} size="md" />
                <span className="text-xs text-[#5f6368] font-mono">
                  {activeShipment.carrier} &bull; {activeShipment.trackingNumber || 'No tracking'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveShipment(null)}>
                  Close
                </Button>

                {/* Step Actions */}
                {canEdit() && activeShipment.status === 'ready_to_pick' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStartPicking}
                    icon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                  >
                    Start Picking
                  </Button>
                )}

                {canEdit() && activeShipment.status === 'picking' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmPacked}
                    icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
                  >
                    Confirm All Packed
                  </Button>
                )}

                {canEdit() && (activeShipment.status === 'packed' || activeShipment.status === 'picking') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenDispatch}
                    className="bg-orange-600 hover:bg-orange-700"
                    icon={<TruckIcon className="h-3.5 w-3.5" />}
                  >
                    Dispatch Shipment
                  </Button>
                )}

                {canEdit() && activeShipment.status === 'dispatched' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMarkDelivered}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
                  >
                    Confirm Delivered
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Visual Workflow Steps Bar */}
            <div className="rounded border border-[#e8eaed] bg-[#f8f9fa] p-3 text-xs">
              <div className="flex items-center justify-between">
                {[
                  { key: 'ready_to_pick', label: '1. Ready to Pick' },
                  { key: 'picking', label: '2. Picking' },
                  { key: 'packed', label: '3. Packed' },
                  { key: 'dispatched', label: '4. Dispatched' },
                  { key: 'delivered', label: '5. Delivered' },
                ].map((step, idx) => {
                  const states = ['ready_to_pick', 'picking', 'packed', 'dispatched', 'delivered'];
                  const curIdx = states.indexOf(activeShipment.status);
                  const isDone = curIdx >= idx;
                  const isCurrent = activeShipment.status === step.key;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] mb-1 transition-colors ${
                          isDone
                            ? 'bg-[#1a73e8] text-white'
                            : 'bg-[#dadce0] text-[#5f6368]'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-medium ${isCurrent ? 'text-[#1a73e8] font-bold' : 'text-[#5f6368]'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipient Details & Documentation Shortcuts */}
            <div className="grid grid-cols-2 gap-3 bg-[#f8f9fa] p-3 rounded border border-[#e8eaed] text-xs">
              <div>
                <span className="text-[#5f6368] block">Ship To:</span>
                <span className="font-semibold text-[#202124] block">{activeShipment.recipientName}</span>
                <span className="text-[#5f6368]">{activeShipment.recipientAddress}</span>
              </div>
              <div className="flex flex-col justify-between items-end">
                <span className="text-[#5f6368] block">Documentation:</span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewPickList(activeShipment.id)}
                    icon={<DocumentTextIcon className="h-3.5 w-3.5" />}
                  >
                    Pick List
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewPackingSlip(activeShipment.id)}
                    icon={<PrinterIcon className="h-3.5 w-3.5" />}
                  >
                    Packing Slip
                  </Button>
                </div>
              </div>
            </div>

            {/* Shipment Items Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-[#3c4043] tracking-wider mb-2">
                Pick &amp; Pack Progress ({activeShipment.items?.length || 0} items)
              </h4>
              <div className="border border-[#dadce0] rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#dadce0] text-[#5f6368]">
                      <th className="p-2.5 font-medium">SKU / Item</th>
                      <th className="p-2.5 font-medium">Storage Location</th>
                      <th className="p-2.5 font-medium text-center">Ordered</th>
                      <th className="p-2.5 font-medium text-center">Picked</th>
                      <th className="p-2.5 font-medium text-center">Packed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eaed]">
                    {activeShipment.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9fa]">
                        <td className="p-2.5">
                          <div className="font-mono font-medium text-[#1a73e8]">{item.sku}</div>
                          <div className="text-[11px] text-[#202124]">{item.productName}</div>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-[#5f6368]">
                          {item.locationCode || 'Warehouse Floor'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-[#202124]">
                          {item.quantityOrdered}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={item.quantityPicked >= item.quantityOrdered ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                            {item.quantityPicked}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={item.quantityPacked >= item.quantityOrdered ? 'text-purple-700 font-semibold' : 'text-slate-500'}>
                            {item.quantityPacked}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Status Timeline */}
            {activeShipment.timeline && activeShipment.timeline.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-[#3c4043] tracking-wider mb-1.5">
                  Status History Trail
                </h4>
                <div className="divide-y divide-[#e8eaed] border border-[#dadce0] rounded bg-white text-xs">
                  {activeShipment.timeline.map((evt: any) => (
                    <div key={evt.id} className="p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={evt.status} size="sm" />
                        <span className="text-[#5f6368]">{evt.notes}</span>
                      </div>
                      <div className="text-[11px] text-[#80868b]">
                        {evt.userName} &bull; {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Printable Pick List Modal */}
      {pickListData && (
        <Modal
          isOpen={isPickListOpen}
          onClose={() => setIsPickListOpen(false)}
          title={`Pick List — Shipment ${pickListData.shipment.shipmentNumber}`}
          description={`Order #${pickListData.shipment.orderNumber} | Facility: ${pickListData.shipment.warehouseName}`}
          footer={
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              Print Pick Sheet
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="border border-slate-300 rounded p-3 bg-slate-50">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold block">Warehouse: {pickListData.shipment.warehouseName}</span>
                  <span className="text-[#5f6368]">Carrier: {pickListData.shipment.carrier}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold block">Pick Sheet # {pickListData.shipment.shipmentNumber}</span>
                  <span className="text-[#5f6368]">Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border border-[#dadce0] text-xs">
              <thead className="bg-[#f8f9fa]">
                <tr className="border-b border-[#dadce0]">
                  <th className="p-2 border-r border-[#dadce0]">Bin Location</th>
                  <th className="p-2 border-r border-[#dadce0]">SKU</th>
                  <th className="p-2 border-r border-[#dadce0]">Product Description</th>
                  <th className="p-2 text-center border-r border-[#dadce0]">Required</th>
                  <th className="p-2 text-center">Check (✓)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0]">
                {pickListData.items.map((i: any) => (
                  <tr key={i.id}>
                    <td className="p-2 font-mono font-bold text-[#1a73e8] border-r border-[#dadce0]">{i.locationCode}</td>
                    <td className="p-2 font-mono font-medium border-r border-[#dadce0]">{i.sku}</td>
                    <td className="p-2 border-r border-[#dadce0]">{i.productName}</td>
                    <td className="p-2 text-center font-bold border-r border-[#dadce0]">{i.quantityOrdered}</td>
                    <td className="p-2 text-center font-mono">[   ]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Printable Packing Slip Modal */}
      {packingSlipData && (
        <Modal
          isOpen={isPackingSlipOpen}
          onClose={() => setIsPackingSlipOpen(false)}
          title={`Packing Slip — ${packingSlipData.shipment.shipmentNumber}`}
          description={`Order #${packingSlipData.shipment.orderNumber}`}
          footer={
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              Print Packing Slip
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border border-[#dadce0] p-3 rounded bg-[#f8f9fa]">
              <div>
                <span className="text-[#5f6368] block">Ship From:</span>
                <span className="font-semibold">{packingSlipData.shipment.warehouseName}</span>
              </div>
              <div>
                <span className="text-[#5f6368] block">Ship To:</span>
                <span className="font-semibold block">{packingSlipData.shipment.recipientName}</span>
                <span>{packingSlipData.shipment.recipientAddress}</span>
              </div>
            </div>

            <table className="w-full border-collapse border border-[#dadce0] text-xs">
              <thead className="bg-[#f8f9fa]">
                <tr className="border-b border-[#dadce0]">
                  <th className="p-2 border-r border-[#dadce0]">SKU</th>
                  <th className="p-2 border-r border-[#dadce0]">Item Description</th>
                  <th className="p-2 text-center border-r border-[#dadce0]">Qty Packed</th>
                  <th className="p-2 text-center">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0]">
                {packingSlipData.items.map((i: any) => (
                  <tr key={i.id}>
                    <td className="p-2 font-mono font-semibold border-r border-[#dadce0]">{i.sku}</td>
                    <td className="p-2 border-r border-[#dadce0]">{i.productName}</td>
                    <td className="p-2 text-center font-bold border-r border-[#dadce0]">{i.quantityPacked}</td>
                    <td className="p-2 text-center text-[#5f6368]">{i.unitOfMeasure || 'EA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Dispatch Confirmation Modal (Safe Concurrency Protection) */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Confirm Shipment Dispatch"
        description="Verify carrier tracking number and execute inventory deduction."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDispatchModalOpen(false)} disabled={isDispatching}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDispatch}
              isLoading={isDispatching}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm Dispatch &amp; Deduct Stock
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900 flex items-start gap-2.5">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Inventory Concurrency Lock:</span>
              Dispatching will atomically deduct on-hand stock and fulfill reservations in a protected MySQL transaction. Duplicate dispatches are blocked.
            </div>
          </div>

          <FormField label="Assigned Carrier Tracking Number" required>
            <input
              type="text"
              value={dispatchTracking}
              onChange={(e) => setDispatchTracking(e.target.value)}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs font-mono text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              required
            />
          </FormField>
        </div>
      </Modal>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Shipment from Order"
        description="Queue a confirmed order for picking and warehouse fulfillment."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubmit} isLoading={isCreating}>
              Create Shipment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <FormField label="Select Confirmed Order" required>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              required
            >
              {confirmedOrders.length === 0 ? (
                <option value="">No confirmed orders available (confirm an order first)</option>
              ) : (
                confirmedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName} ({o.itemsCount} lines)
                  </option>
                ))
              )}
            </select>
          </FormField>

          <FormField label="Logistics Carrier" required>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
            >
              <option value="FedEx Ground">FedEx Ground</option>
              <option value="UPS Express Saver">UPS Express Saver</option>
              <option value="DHL Worldwide">DHL Worldwide</option>
              <option value="USPS Priority Mail">USPS Priority Mail</option>
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
