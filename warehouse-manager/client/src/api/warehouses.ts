import { api } from './client';
import type { Warehouse, WarehouseLocation, WarehouseFormData, FilterParams } from '../types';

export const warehousesApi = {
  list: async (params?: FilterParams): Promise<Warehouse[]> => {
    const res = await api.get<any>('/warehouses', params);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  getById: (id: string) =>
    api.get<Warehouse & { locations?: WarehouseLocation[] }>(`/warehouses/${id}`),

  create: (data: WarehouseFormData) =>
    api.post<Warehouse>('/warehouses', data),

  update: (id: string, data: Partial<WarehouseFormData>) =>
    api.put<Warehouse>(`/warehouses/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/warehouses/${id}`),

  getLocations: (warehouseId: string, params?: FilterParams) =>
    api.get<WarehouseLocation[]>(`/warehouses/${warehouseId}/locations`, params),

  addLocation: (warehouseId: string, data: Partial<WarehouseLocation>) =>
    api.post<WarehouseLocation>(`/warehouses/${warehouseId}/locations`, data),

  updateLocation: (warehouseId: string, locationId: string, data: Partial<WarehouseLocation>) =>
    api.put<WarehouseLocation>(`/warehouses/${warehouseId}/locations/${locationId}`, data),

  deleteLocation: (warehouseId: string, locationId: string) =>
    api.delete<void>(`/warehouses/${warehouseId}/locations/${locationId}`),

  getStockSummary: (warehouseId: string) =>
    api.get<{ totalItems: number; totalUnits: number; utilizationPercent: number; categories: Array<{ name: string; count: number }> }>(`/warehouses/${warehouseId}/stock-summary`),
};
