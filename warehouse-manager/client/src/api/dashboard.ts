import { api } from './client';
import type {
  DashboardStats,
  ShipmentStatusDistribution,
  StockTrend,
  ActivityEntry,
  AlertItem,
} from '../types';

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats'),

  getShipmentDistribution: () =>
    api.get<ShipmentStatusDistribution[]>('/dashboard/shipment-distribution'),

  getStockTrends: (params?: { startDate?: string; endDate?: string }) =>
    api.get<StockTrend[]>('/dashboard/stock-trends', params),

  getRecentActivity: (limit?: number) =>
    api.get<ActivityEntry[]>('/dashboard/recent-activity', { limit }),

  getAlerts: () =>
    api.get<AlertItem[]>('/dashboard/alerts'),
};
