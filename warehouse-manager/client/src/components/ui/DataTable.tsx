import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, InboxIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  isLoading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found matching your filters.',
  sortBy,
  sortDirection = 'asc',
  onSort,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, total);

  const getRowKey = (row: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(row);
    return row[keyField] !== undefined ? String(row[keyField]) : String(idx);
  };

  return (
    <div className="bg-white border border-[#dadce0] rounded-md shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#dadce0] bg-[#f8f9fa] text-[#5f6368] select-none">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                const canSort = col.sortable && onSort;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    onClick={() => canSort && onSort(col.key)}
                    className={clsx(
                      'py-2.5 px-3.5 font-medium tracking-tight',
                      canSort && 'cursor-pointer hover:bg-[#ebeef1] hover:text-[#202124] transition-colors',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    <div className={clsx('inline-flex items-center gap-1', col.align === 'right' && 'justify-end')}>
                      <span>{col.header}</span>
                      {isSorted && (
                        sortDirection === 'asc' ? (
                          <ChevronUpIcon className="h-3.5 w-3.5 text-[#1a73e8]" />
                        ) : (
                          <ChevronDownIcon className="h-3.5 w-3.5 text-[#1a73e8]" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eaed] text-[#202124]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="py-3 px-3.5">
                      <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#5f6368]">
                  <div className="flex flex-col items-center justify-center">
                    <InboxIcon className="h-10 w-10 text-slate-300 stroke-1 mb-2" />
                    <p className="text-sm font-medium text-[#3c4043]">{emptyMessage}</p>
                    <p className="text-xs text-[#80868b] mt-0.5">Try clearing your search query or adjusting filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    'hover:bg-[#f8f9fa] transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'py-2.5 px-3.5 text-xs',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, idx) : (row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && (
        <div className="flex items-center justify-between border-t border-[#dadce0] bg-[#f8f9fa] px-3.5 py-2 text-xs text-[#5f6368]">
          <div className="flex items-center gap-1">
            <span>Showing</span>
            <span className="font-semibold text-[#202124]">{startItem}</span>
            <span>–</span>
            <span className="font-semibold text-[#202124]">{endItem}</span>
            <span>of</span>
            <span className="font-semibold text-[#202124]">{total}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f1f3f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-xs text-[#3c4043]">
              Page <span className="font-medium text-[#202124]">{page}</span> of <span className="font-medium text-[#202124]">{totalPages}</span>
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f1f3f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
