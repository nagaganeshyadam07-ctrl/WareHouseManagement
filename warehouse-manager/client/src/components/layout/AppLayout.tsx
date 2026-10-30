import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa]">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedWarehouse={selectedWarehouse}
          onSelectWarehouse={setSelectedWarehouse}
        />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ selectedWarehouse }} />
          </div>
        </main>
      </div>
    </div>
  );
};
