import React from 'react';
import clsx from 'clsx';

export type BadgeVariant =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'draft'
  | 'pending'
  | 'ready_to_pick'
  | 'picking'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'confirmed'
  | 'processing'
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low'
  | 'active'
  | 'inactive'
  | 'completed'
  | 'in_progress';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', customLabel }) => {
  const normalized = (status || '').toLowerCase().replace(/[-\s]/g, '_') as BadgeVariant;

  const styleMap: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    // Inventory
    in_stock: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'In Stock' },
    low_stock: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Low Stock' },
    out_of_stock: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Out of Stock' },

    // Order & Shipment Statuses
    draft: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Draft' },
    pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Pending' },
    confirmed: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500', label: 'Confirmed' },
    processing: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Processing' },
    ready_to_pick: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Ready to Pick' },
    picking: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Picking' },
    packed: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Packed' },
    dispatched: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Dispatched' },
    delivered: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600', label: 'Delivered' },
    fulfilled: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600', label: 'Fulfilled' },
    partially_fulfilled: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', dot: 'bg-teal-500', label: 'Partial Fulfilled' },
    completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600', label: 'Completed' },
    in_progress: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500', label: 'In Progress' },
    cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-400', label: 'Cancelled' },

    // Priorities
    urgent: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700 font-semibold', dot: 'bg-rose-600', label: 'Urgent' },
    high: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', label: 'High' },
    normal: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Normal' },
    low: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-300', label: 'Low' },

    // General
    active: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Active' },
    inactive: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Inactive' },
  };

  const config = styleMap[normalized] || {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  const displayText = customLabel || config.label;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {displayText}
    </span>
  );
};
