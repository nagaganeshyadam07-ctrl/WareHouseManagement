import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { api } from '../api/client';
import type { AuditLogEntry, PaginatedResponse } from '../types';
import { DataTable, type Column } from '../components/ui/DataTable';
import toast from 'react-hot-toast';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<AuditLogEntry>>('/audit', {
        page,
        pageSize: 25,
        action: actionFilter || undefined,
        search: search || undefined,
      });
      if (res) {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err: any) {
      if (err.status === 403) {
        toast.error('Audit trail requires Manager or Admin privileges');
      } else {
        toast.error('Failed to load audit trail');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, search]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => (
        <span className="text-[11px] text-[#5f6368] font-mono">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Operator',
      render: (r) => <span className="font-medium text-[#202124]">{r.userName}</span>,
    },
    {
      key: 'action',
      header: 'Action Event',
      render: (r) => (
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#e8f0fe] text-[#1a73e8] px-2 py-0.5 rounded border border-blue-200">
          {r.action}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: 'Resource Target',
      render: (r) => (
        <span className="text-xs text-[#3c4043] capitalize font-medium">
          {r.entityType} #{r.entityId}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Event Parameters & Payload',
      render: (r) => (
        <span className="font-mono text-[11px] text-[#5f6368] truncate max-w-md block">
          {r.details || '—'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (r) => <span className="font-mono text-[10px] text-[#80868b]">{r.ipAddress || '127.0.0.1'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Enterprise Audit Trail</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Immutable log of inventory modifications, shipment dispatches, receiving completions, and authentication events.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>RBAC Enforcement Active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-[#dadce0] bg-white p-2.5 shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5f6368]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user, or resource..."
            className="w-full rounded border border-[#dadce0] py-1.5 pl-8 pr-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded border border-[#dadce0] py-1.5 px-2.5 text-xs text-[#202124] bg-white focus:border-[#1a73e8] focus:outline-none"
        >
          <option value="">All Action Events</option>
          <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
          <option value="STOCK_TRANSFER">STOCK_TRANSFER</option>
          <option value="DISPATCH_SHIPMENT">DISPATCH_SHIPMENT</option>
          <option value="RECEIPT_COMPLETE">RECEIPT_COMPLETE</option>
          <option value="CONFIRM_ORDER">CONFIRM_ORDER</option>
          <option value="CANCEL_ORDER">CANCEL_ORDER</option>
          <option value="LOGIN">LOGIN</option>
        </select>

        <div className="text-xs text-[#5f6368]">
          Total Events: <span className="font-semibold text-[#202124]">{total}</span>
        </div>
      </div>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        page={page}
        pageSize={25}
        total={total}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
