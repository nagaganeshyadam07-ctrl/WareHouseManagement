import { api } from './client';
import type { Supplier, SupplierFormData, PaginatedResponse, FilterParams } from '../types';

export const suppliersApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers', params),

  getById: (id: string) =>
    api.get<Supplier>(`/suppliers/${id}`),

  create: (data: SupplierFormData) =>
    api.post<Supplier>('/suppliers', data),

  update: (id: string, data: Partial<SupplierFormData>) =>
    api.put<Supplier>(`/suppliers/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/suppliers/${id}`),
};
