import { api } from './client';
import type { User, LoginCredentials } from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<{ token: string; user: User }>('/auth/login', credentials),

  logout: () => api.post<void>('/auth/logout'),

  getMe: () => api.get<User>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<void>('/auth/change-password', data),

  updateProfile: (data: { fullName: string; email: string; phone?: string }) =>
    api.put<User>('/auth/profile', data),
};
