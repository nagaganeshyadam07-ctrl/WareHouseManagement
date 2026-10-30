import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReceivingPage } from './pages/ReceivingPage';
import { OrdersPage } from './pages/OrdersPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { AuditLogPage } from './pages/AuditLogPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <span className="text-xs font-medium text-[#5f6368]">Loading Warehouse Operations Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#202124',
              color: '#ffffff',
              fontSize: '13px',
              borderRadius: '6px',
              padding: '10px 14px',
            },
            success: {
              iconTheme: {
                primary: '#34a853',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ea4335',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="receiving" element={<ReceivingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="shipments" element={<ShipmentsPage />} />
            <Route path="warehouses" element={<WarehousesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
