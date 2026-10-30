import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TruckIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats, ShipmentStatusDistribution, StockTrend, ActivityEntry, AlertItem } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distribution, setDistribution] = useState<ShipmentStatusDistribution[]>([]);
  const [trends, setTrends] = useState<StockTrend[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, distData, trendData, actData, alertData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getShipmentDistribution(),
        dashboardApi.getStockTrends(),
        dashboardApi.getRecentActivity(8),
        dashboardApi.getAlerts(),
      ]);

      setStats(statsData);
      setDistribution(distData);
      setTrends(trendData);
      setActivities(actData);
      setAlerts(alertData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpiCards = [
    {
      title: 'Units on Hand',
      value: stats?.unitsInStock?.toLocaleString() || '0',
      label: 'Total inventory items',
      icon: ArchiveBoxIcon,
      color: 'text-[#1a73e8]',
      bg: 'bg-blue-50',
      to: '/inventory',
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems?.toString() || '0',
      label: 'Below reorder threshold',
      icon: ExclamationTriangleIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      to: '/inventory?status=low_stock',
    },
    {
      title: 'Orders in Queue',
      value: stats?.ordersAwaitingFulfillment?.toString() || '0',
      label: 'Pending & confirmed',
      icon: ShoppingCartIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      to: '/orders',
    },
    {
      title: 'Shipments Awaiting Dispatch',
      value: stats?.shipmentsAwaitingDispatch?.toString() || '0',
      label: 'Ready / picking / packed',
      icon: TruckIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      to: '/shipments',
    },
    {
      title: 'Pending Inbound Receipts',
      value: stats?.pendingReceipts?.toString() || '0',
      label: 'Draft & receiving',
      icon: ArrowDownTrayIcon,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      to: '/receiving',
    },
    {
      title: 'Active Catalog SKUs',
      value: stats?.totalProducts?.toString() || '0',
      label: 'Categorized items',
      icon: CheckCircleIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      to: '/inventory',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dadce0] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#202124]">Operations Dashboard</h1>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Real-time warehouse KPIs, fulfillment pipelines, and inventory movements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
            icon={<ArrowPathIcon className="h-3.5 w-3.5" />}
          >
            Refresh Metrics
          </Button>
          <Link to="/inventory">
            <Button variant="primary" size="sm">
              Manage Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Actionable Alerts Bar */}
      {alerts.length > 0 && (
        <div className="rounded-md border border-[#dadce0] bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3c4043]">
              Active Operational Alerts ({alerts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`rounded border p-2.5 text-xs flex flex-col justify-between ${
                  alert.severity === 'error'
                    ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                    : alert.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                    : 'border-blue-200 bg-blue-50/60 text-blue-900'
                }`}
              >
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="text-[11px] text-[#5f6368] mt-0.5">{alert.description}</div>
                </div>
                <div className="mt-2 text-right">
                  <Link
                    to={
                      alert.entityType === 'product'
                        ? '/inventory'
                        : alert.entityType === 'order'
                        ? '/orders'
                        : '/receiving'
                    }
                    className="font-medium text-[#1a73e8] hover:underline text-[11px]"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.title}
            to={kpi.to}
            className="group rounded-md border border-[#dadce0] bg-white p-3.5 shadow-xs hover:border-[#1a73e8] hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5f6368]">{kpi.title}</span>
              <div className={`p-1 rounded ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-[#202124]">
              {isLoading ? '—' : kpi.value}
            </div>
            <div className="mt-0.5 text-[11px] text-[#80868b] truncate">{kpi.label}</div>
          </Link>
        ))}
      </div>

      {/* Middle Section: Shipment Pipeline & Movement Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment Status Distribution */}
        <div className="rounded-md border border-[#dadce0] bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#e8eaed] pb-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3c4043]">
                Shipment Pipeline Breakdown
              </h2>
              <Link to="/shipments" className="text-xs text-[#1a73e8] hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {distribution.map((d) => (
                <div key={d.status} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <StatusBadge status={d.status} size="sm" />
                    <span className="font-semibold text-[#202124]">{d.count} shipments</span>
                  </div>
                  <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: d.color,
                        width: `${Math.min(100, (d.count / (distribution.reduce((acc, curr) => acc + curr.count, 0) || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {distribution.length === 0 && !isLoading && (
                <p className="text-xs text-[#80868b] py-6 text-center">No shipment records found.</p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#e8eaed] text-right">
            <Link to="/shipments">
              <Button variant="secondary" size="sm">
                Open Fulfillment Pipeline &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Stock Movements Trend Chart / Summary */}
        <div className="lg:col-span-2 rounded-md border border-[#dadce0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e8eaed] pb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3c4043]">
              Daily Stock Movement Volume (Recent 7 Days)
            </h2>
            <span className="text-xs text-[#5f6368]">Inbound Received vs Shipped</span>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {trends.map((t, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="h-32 w-full flex items-end justify-center gap-1 bg-[#f8f9fa] rounded p-1">
                    <div
                      title={`Received: ${t.received} units`}
                      style={{ height: `${Math.min(100, Math.max(12, t.received * 1.5))}%` }}
                      className="w-1/2 bg-[#1a73e8] rounded-t transition-all"
                    />
                    <div
                      title={`Shipped: ${t.shipped} units`}
                      style={{ height: `${Math.min(100, Math.max(8, t.shipped * 1.5))}%` }}
                      className="w-1/2 bg-[#e37400] rounded-t transition-all"
                    />
                  </div>
                  <span className="mt-1 text-[10px] text-[#5f6368] font-medium truncate w-full">
                    {t.date ? String(t.date).slice(5) : 'Day'}
                  </span>
                  <div className="text-[10px] text-[#80868b] flex flex-col">
                    <span className="text-[#1a73e8]">+{t.received}</span>
                    <span className="text-[#e37400]">-{t.shipped}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-center gap-5 text-xs text-[#5f6368] pt-2 border-t border-[#e8eaed]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-[#1a73e8]" />
                <span>Inbound Received</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-[#e37400]" />
                <span>Outbound Shipped</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Operations Log */}
      <div className="rounded-md border border-[#dadce0] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#e8eaed] pb-2.5">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-[#5f6368]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3c4043]">
              Live Operational Activity Feed
            </h2>
          </div>
          <Link to="/audit" className="text-xs text-[#1a73e8] hover:underline">
            View full audit trail &rarr;
          </Link>
        </div>

        <div className="mt-3 divide-y divide-[#e8eaed]">
          {activities.map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium bg-[#f1f3f4] text-[#3c4043] shrink-0">
                  {act.action}
                </span>
                <span className="font-medium text-[#202124] truncate">
                  {act.entityName}
                </span>
                <span className="text-[#5f6368] truncate hidden md:inline">
                  {act.details}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[#80868b] text-[11px]">
                <span className="text-[#3c4043] font-medium">{act.userName}</span>
                <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
          {activities.length === 0 && !isLoading && (
            <p className="text-xs text-[#80868b] py-6 text-center">No recent activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};
