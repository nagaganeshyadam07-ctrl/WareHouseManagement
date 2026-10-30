import { api } from './client';
import type { Receipt, ReceiptItem, ReceiptFormData, PaginatedResponse, FilterParams } from '../types';

export const receiptsApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<Receipt>>('/receipts', params),

  getById: (id: string) =>
    api.get<Receipt & { items: ReceiptItem[] }>(`/receipts/${id}`),

  create: (data: ReceiptFormData) =>
    api.post<Receipt>('/receipts', data),

  update: (id: string, data: Partial<ReceiptFormData>) =>
    api.put<Receipt>(`/receipts/${id}`, data),

  updateItem: (receiptId: string, itemId: string, data: { receivedQuantity: number; notes?: string }) =>
    api.patch<ReceiptItem>(`/receipts/${receiptId}/items/${itemId}`, data),

  addItem: (receiptId: string, data: { productId: string; expectedQuantity: number }) =>
    api.post<ReceiptItem>(`/receipts/${receiptId}/items`, data),

  removeItem: (receiptId: string, itemId: string) =>
    api.delete<void>(`/receipts/${receiptId}/items/${itemId}`),

  complete: (id: string) =>
    api.post<Receipt>(`/receipts/${id}/complete`),

  cancel: (id: string) =>
    api.post<Receipt>(`/receipts/${id}/cancel`),
};
