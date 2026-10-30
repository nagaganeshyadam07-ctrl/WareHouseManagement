import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarSquareIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ShoppingCartIcon,
  TruckIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: ChartBarSquareIcon },
    { name: 'Inventory & Stock', to: '/inventory', icon: ArchiveBoxIcon },
    { name: 'Inbound Receiving', to: '/receiving', icon: ArrowDownTrayIcon },
    { name: 'Orders & Allocation', to: '/orders', icon: ShoppingCartIcon },
    { name: 'Shipments & Dispatch', to: '/shipments', icon: TruckIcon },
    { name: 'Warehouses & Locations', to: '/warehouses', icon: BuildingOfficeIcon },
    { name: 'Suppliers', to: '/suppliers', icon: BuildingStorefrontIcon },
    { name: 'Audit Trail', to: '/audit', icon: ShieldCheckIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#202124]/30 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[#dadce0] bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-14 items-center justify-between border-b border-[#dadce0] px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1a73e8] text-white font-semibold text-sm">
              WM
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-[#202124] leading-tight">
                Warehouse Manager
              </span>
              <span className="block text-[10px] uppercase font-medium text-[#5f6368] tracking-wider">
                Enterprise Logistics
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#5f6368] hover:bg-[#f1f3f4] md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <div className="px-3 pb-1 pt-1 text-[11px] font-semibold text-[#80868b] uppercase tracking-wider">
            Operations
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors select-none',
                  isActive
                    ? 'bg-[#e8f0fe] text-[#1a73e8] font-semibold'
                    : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card in Footer */}
        <div className="border-t border-[#dadce0] bg-[#f8f9fa] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8eaed] text-xs font-medium text-[#3c4043]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-[#202124] leading-tight">
                {user?.fullName || 'Active Operator'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] uppercase font-medium text-[#5f6368] tracking-wider">
                  {user?.role || 'staff'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
