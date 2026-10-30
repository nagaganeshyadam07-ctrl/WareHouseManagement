import React, { useState } from 'react';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedWarehouse: string;
  onSelectWarehouse: (whId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  selectedWarehouse,
  onSelectWarehouse,
}) => {
  const { user, logout, login } = useAuth();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const demoAccounts = [
    { role: 'Admin', username: 'admin', desc: 'Full System Control' },
    { role: 'Manager', username: 'manager', desc: 'Approvals & Transfers' },
    { role: 'Staff', username: 'staff', desc: 'Picks, Packs & Receives' },
    { role: 'Viewer', username: 'viewer', desc: 'Read-only Auditor' },
  ];

  const handleRoleSwitch = async (username: string) => {
    setIsRoleMenuOpen(false);
    await login({ username, password: `${username}123` });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#dadce0] bg-white px-4">
      {/* Left: Mobile hamburger & Active Location selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded p-1.5 text-[#5f6368] hover:bg-[#f1f3f4] md:hidden"
          aria-label="Toggle navigation"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Global Warehouse Filter */}
        <div className="flex items-center gap-1.5 text-xs text-[#3c4043]">
          <BuildingOffice2Icon className="h-4 w-4 text-[#5f6368] hidden sm:block" />
          <span className="font-medium text-[#5f6368] hidden sm:inline">Facility:</span>
          <select
            value={selectedWarehouse}
            onChange={(e) => onSelectWarehouse(e.target.value)}
            className="rounded border border-[#dadce0] bg-[#f8f9fa] py-1 px-2.5 text-xs font-medium text-[#202124] focus:border-[#1a73e8] focus:bg-white focus:outline-none transition-colors"
          >
            <option value="">All Facilities (Global)</option>
            <option value="1">WH-001 (Main Hub, Dallas)</option>
            <option value="2">WH-002 (East DC, Atlanta)</option>
            <option value="3">WH-003 (West Logistics, Portland)</option>
          </select>
        </div>
      </div>

      {/* Right: Quick Role Switcher & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-[#f8f9fa] px-2.5 py-1 text-xs text-[#3c4043] hover:bg-[#ebeef1] hover:text-[#202124] transition-colors"
            title="Switch demo role to test RBAC permissions"
          >
            <span className="text-[#5f6368]">Role:</span>
            <span className="font-semibold capitalize text-[#1a73e8]">{user?.role || 'staff'}</span>
            <span className="text-[10px] text-[#80868b]">▾</span>
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-[#dadce0] bg-white py-1 shadow-lg z-50 text-xs">
              <div className="border-b border-[#e8eaed] px-3 py-1.5 text-[11px] font-semibold uppercase text-[#5f6368]">
                Switch Active Role
              </div>
              {demoAccounts.map((demo) => (
                <button
                  key={demo.username}
                  onClick={() => handleRoleSwitch(demo.username)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#f1f3f4] flex flex-col transition-colors ${user?.username === demo.username ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#3c4043]'}`}
                >
                  <span className="font-medium capitalize">{demo.role} ({demo.username})</span>
                  <span className="text-[10px] text-[#80868b]">{demo.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#3c4043] pl-2 border-l border-[#e8eaed]">
          <UserCircleIcon className="h-4 w-4 text-[#5f6368]" />
          <span className="font-medium text-[#202124]">{user?.fullName?.split(' ')[0] || 'User'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="rounded p-1.5 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#d93025] transition-colors"
          title="Sign Out"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
