import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { suppliersApi } from '../api/suppliers';
import type { Supplier } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const SuppliersPage: React.FC = () => {
  const { canManage } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Supplier Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await suppliersApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
      });
      if (res) {
        setSuppliers(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, search]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Supplier name and code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await suppliersApi.create({
        name,
        code,
        contactName,
        email,
        phone,
        address: '100 Vendor Blvd',
        city,
        state,
        country: 'USA',
        status: 'active',
      });
      toast.success('Supplier created successfully');
      setIsAddOpen(false);
      setName('');
      setCode('');
      setContactName('');
      setEmail('');
      setPhone('');
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'code',
      header: 'Supplier Code',
      render: (r) => <span className="font-mono font-medium text-[#1a73e8]">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Supplier Company',
      render: (r) => (
        <div>
          <div className="font-medium text-[#202124]">{r.name}</div>
          <div className="text-[10px] text-[#5f6368] flex items-center gap-1">
            <MapPinIcon className="h-3 w-3 text-[#80868b]" /> {r.city}, {r.state}
          </div>
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Point of Contact',
      render: (r) => <span className="font-medium text-[#3c4043]">{r.contactName || '—'}</span>,
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (r) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 text-[#5f6368]">
            <EnvelopeIcon className="h-3 w-3 text-[#80868b]" />
            <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
          </div>
          {r.phone && (
            <div className="flex items-center gap-1 text-[11px] text-[#80868b] mt-0.5">
              <PhoneIcon className="h-3 w-3 text-[#80868b]" />
              <span>{r.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'productsCount',
      header: 'Total Receipts',
      align: 'center',
      render: (r) => <span className="font-semibold text-[#202124]">{r.productsCount}</span>,
    },
    {
      key: 'status',
      header: 'Vendor Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Vendor &amp; Supplier Directory</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Registered wholesale vendors, authorized distributors, and procurement contacts.
          </p>
        </div>
        {canManage() && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Vendor
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor name, code, contact or email..."
          className="min-w-[280px] rounded border border-[#dadce0] py-1.5 px-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
        />
        <div className="text-xs text-[#5f6368]">
          Active Suppliers: <span className="font-bold text-[#202124]">{total}</span>
        </div>
      </div>

      {/* Supplier Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Vendor Profile"
        description="Register a new procurement source for inbound receiving."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSupplier} isLoading={isSubmitting}>
              Register Vendor
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Vendor Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Industrial Supplies"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>

            <FormField label="Vendor Code" required>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SUP-009"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs font-mono text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Contact Person">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
            <FormField label="Contact Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@vendor.com"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
            <FormField label="Phone Number">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0100"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Atlanta"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
            <FormField label="State">
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="GA"
                className="w-full rounded border border-[#dadce0] px-3 py-1.5 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
