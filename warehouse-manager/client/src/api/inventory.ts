import { api } from './client';
import type { InventoryItem, StockAdjustment, StockTransfer, StockMovement, PaginatedResponse, FilterParams } from '../types';

export const inventoryApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<InventoryItem>>('/inventory', params),

  getByProduct: (productId: string) =>
    api.get<InventoryItem[]>(`/inventory/product/${productId}`),

  adjustStock: (data: StockAdjustment) =>
    api.post<void>('/inventory/adjust', data),

  transferStock: (data: StockTransfer) =>
    api.post<void>('/inventory/transfer', data),

  getMovements: (params?: FilterParams) =>
    api.get<PaginatedResponse<StockMovement>>('/inventory/movements', params),

  getMovementsByProduct: (productId: string, params?: FilterParams) =>
    api.get<PaginatedResponse<StockMovement>>(`/inventory/movements/product/${productId}`, params),

  exportCsv: (params?: FilterParams) =>
    api.get<Blob>('/inventory/export', params),

  importCsv: (formData: FormData) =>
    api.upload<{ imported: number; errors: string[] }>('/inventory/import', formData),
};
