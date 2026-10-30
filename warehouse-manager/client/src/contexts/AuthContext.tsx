import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials } from '../types';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  canEdit: () => boolean;
  canManage: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const res = await authApi.login(credentials);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        toast.success(`Welcome back, ${res.user.fullName}`);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    toast.success('Signed out successfully');
  };

  const role = user?.role;
  const canEdit = () => role === 'admin' || role === 'manager' || role === 'operator' || (role as string) === 'staff';
  const canManage = () => role === 'admin' || role === 'manager';
  const isAdmin = () => role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        canEdit,
        canManage,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
