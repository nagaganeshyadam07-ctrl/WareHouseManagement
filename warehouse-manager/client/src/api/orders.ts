import { api } from './client';
import type { Order, OrderItem, OrderFormData, PaginatedResponse, FilterParams } from '../types';

export const ordersApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<Order>>('/orders', params),

  getById: (id: string) =>
    api.get<Order & { items: OrderItem[] }>(`/orders/${id}`),

  create: (data: OrderFormData) =>
    api.post<Order>('/orders', data),

  update: (id: string, data: Partial<OrderFormData>) =>
    api.put<Order>(`/orders/${id}`, data),

  confirm: (id: string) =>
    api.post<Order>(`/orders/${id}/confirm`),

  cancel: (id: string, reason?: string) =>
    api.post<Order>(`/orders/${id}/cancel`, { reason }),

  checkAvailability: (id: string) =>
    api.get<{ items: Array<{ productId: string; available: number; required: number }> }>(`/orders/${id}/availability`),
};
