import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { warehousesApi } from '../api/warehouses';
import type { Warehouse, WarehouseLocation } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const WarehousesPage: React.FC = () => {
  const { canManage } = useAuth();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWhId, setSelectedWhId] = useState<string>('1');
  const [activeWh, setActiveWh] = useState<(Warehouse & { locations?: WarehouseLocation[] }) | null>(null);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  // Add Warehouse Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState('20000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const data = await warehousesApi.list();
      setWarehouses(data || []);
      if (data && data.length > 0 && !selectedWhId) {
        setSelectedWhId(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load facilities');
    }
  };

  const fetchWarehouseDetails = async (id: string) => {
    setIsLocationsLoading(true);
    try {
      const data = await warehousesApi.getById(id);
      setActiveWh(data);
    } catch (err) {
      toast.error('Failed to load storage locations');
    } finally {
      setIsLocationsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWhId) {
      fetchWarehouseDetails(selectedWhId);
    }
  }, [selectedWhId]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await warehousesApi.create({
        name,
        code,
        address,
        city,
        state,
        zipCode: '75001',
        country: 'USA',
        capacity: parseInt(capacity, 10) || 10000,
        status: 'active',
      });
      toast.success('Facility added successfully');
      setIsAddOpen(false);
      setName('');
      setCode('');
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Warehouses &amp; Storage Locations</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Physical facility boundaries, bin allocation hierarchies, and storage capacity utilization.
          </p>
        </div>
        {canManage() && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Facility
          </Button>
        )}
      </div>

      {/* Facility Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {warehouses.map((wh) => {
          const isSelected = selectedWhId === wh.id;
          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWhId(wh.id)}
              className={`cursor-pointer rounded-md border p-3.5 transition-all text-xs ${
                isSelected
                  ? 'border-[#1a73e8] bg-white ring-1 ring-[#1a73e8] shadow-xs'
                  : 'border-[#dadce0] bg-white hover:border-[#bdc1c6]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-bold text-[#1a73e8]">{wh.code}</span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <h3 className="font-semibold text-sm text-[#202124]">{wh.name}</h3>
              <p className="text-[#5f6368] mt-0.5 flex items-center gap-1">
                <MapPinIcon className="h-3 w-3 text-[#80868b]" />
                {wh.city}, {wh.state}
              </p>

              {/* Utilization progress */}
              <div className="mt-3 pt-2.5 border-t border-[#e8eaed]">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-[#5f6368]">Capacity Utilization</span>
                  <span className="font-bold text-[#202124]">{wh.currentUtilization}%</span>
                </div>
                <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-[#1a73e8]"
                    style={{ width: `${Math.min(100, wh.currentUtilization)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#80868b] mt-1.5">
                  <span>{(wh as any).totalStock?.toLocaleString() || 0} units stored</span>
                  <span>{wh.locationsCount} bins</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage Location Hierarchy Matrix */}
      {activeWh && (
        <div className="rounded-md border border-[#dadce0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#dadce0] pb-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202124]">
                Storage Locations Directory &bull; {activeWh.name} ({activeWh.code})
              </h2>
              <p className="text-xs text-[#5f6368]">
                Zone &gt; Aisle &gt; Rack &gt; Bin mapping
              </p>
            </div>
            <div className="text-xs text-[#5f6368]">
              Total Configured Locations: <span className="font-bold text-[#202124]">{activeWh.locations?.length || 0}</span>
            </div>
          </div>

          {isLocationsLoading ? (
            <div className="py-12 text-center text-xs text-[#5f6368]">Loading storage locations...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {activeWh.locations?.map((loc) => (
                <div
                  key={loc.id}
                  className="rounded border border-[#dadce0] p-2 bg-[#f8f9fa] hover:bg-white hover:border-[#1a73e8] transition-colors text-xs"
                >
                  <div className="font-mono font-bold text-[#1a73e8] text-[11px] truncate">
                    {loc.label || (loc as any).code}
                  </div>
                  <div className="text-[10px] text-[#5f6368] mt-0.5 truncate">
                    {loc.zone || 'Zone A'}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] border-t border-[#e8eaed] pt-1">
                    <span className="text-[#80868b]">Items:</span>
                    <span className="font-semibold text-[#202124]">{loc.currentItems}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Facility Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Warehouse Facility"
        description="Add a new distribution center or regional fulfillment hub."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateWarehouse} isLoading={isSubmitting}>
              Save Facility
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Facility Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. South Fulfillment Depot"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>

            <FormField label="Facility Code" required>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WH-004"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs font-mono text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>
          </div>

          <FormField label="Street Address">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 1000 Logistics Way"
              className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="City">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Houston"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
            <FormField label="State">
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="TX"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
            <FormField label="Capacity (Units)">
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
