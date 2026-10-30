import { api } from './client';
import type { Shipment, ShipmentItem, ShipmentFormData, PaginatedResponse, FilterParams } from '../types';

export const shipmentsApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<Shipment>>('/shipments', params),

  getById: (id: string) =>
    api.get<Shipment & { items: ShipmentItem[] }>(`/shipments/${id}`),

  create: (data: ShipmentFormData) =>
    api.post<Shipment>('/shipments', data),

  update: (id: string, data: Partial<ShipmentFormData>) =>
    api.put<Shipment>(`/shipments/${id}`, data),

  readyToPick: (id: string) =>
    api.post<Shipment>(`/shipments/${id}/ready-to-pick`),

  startPicking: (id: string) =>
    api.post<Shipment>(`/shipments/${id}/start-picking`),

  confirmPacked: (id: string, items: Array<{ itemId: string; pickedQuantity: number }>) =>
    api.post<Shipment>(`/shipments/${id}/confirm-packed`, { items }),

  dispatch: (id: string, trackingNumber: string) =>
    api.post<Shipment>(`/shipments/${id}/dispatch`, { trackingNumber }),

  markDelivered: (id: string) =>
    api.post<Shipment>(`/shipments/${id}/mark-delivered`),

  cancel: (id: string, reason?: string) =>
    api.post<Shipment>(`/shipments/${id}/cancel`, { reason }),

  getPickList: (id: string) =>
    api.get<{ shipment: Shipment; items: ShipmentItem[] }>(`/shipments/${id}/pick-list`),

  getPackingSlip: (id: string) =>
    api.get<{ shipment: Shipment; items: ShipmentItem[] }>(`/shipments/${id}/packing-slip`),
};
