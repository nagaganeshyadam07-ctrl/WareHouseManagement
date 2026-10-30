import { api } from './client';
import type { Product, ProductFormData, PaginatedResponse, FilterParams } from '../types';

export const productsApi = {
  list: (params?: FilterParams) =>
    api.get<PaginatedResponse<Product>>('/products', params),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  create: (data: ProductFormData) =>
    api.post<Product>('/products', data),

  update: (id: string, data: Partial<ProductFormData>) =>
    api.put<Product>(`/products/${id}`, data),

  archive: (id: string) =>
    api.patch<Product>(`/products/${id}/archive`),

  getCategories: () =>
    api.get<string[]>('/products/categories'),
};
