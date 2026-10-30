import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const demoPresets = [
    { label: 'Admin (Full Access)', user: 'admin', pass: 'admin123', role: 'admin' },
    { label: 'Manager (Operations)', user: 'manager', pass: 'manager123', role: 'manager' },
    { label: 'Staff (Warehouse Floor)', user: 'staff', pass: 'staff123', role: 'staff' },
    { label: 'Viewer (Read-Only)', user: 'viewer', pass: 'viewer123', role: 'viewer' },
  ];

  const handleSelectPreset = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    const success = await login({ username, password });
    setIsLoading(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-sm">
        {/* App Logo & Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#1a73e8] text-white font-bold text-lg shadow-sm">
            WM
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-[#202124]">
            Warehouse Manager
          </h1>
          <p className="text-xs text-[#5f6368] mt-1">
            Enterprise Stock & Shipment Operations Portal
          </p>
        </div>

        {/* Login Form Box */}
        <div className="rounded-lg border border-[#dadce0] bg-white p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <FormField label="Username or Email" required>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-2 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                placeholder="e.g. admin"
                autoComplete="username"
                required
              />
            </FormField>

            <FormField label="Password" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[#dadce0] px-3 py-2 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 border-t border-[#e8eaed] pt-4">
            <span className="block text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">
              Fast Demo Accounts (Click to load)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {demoPresets.map((p) => (
                <button
                  key={p.user}
                  type="button"
                  onClick={() => handleSelectPreset(p.user, p.pass)}
                  className={`rounded border px-2 py-1.5 text-left text-xs transition-colors ${username === p.user ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8] font-medium' : 'border-[#dadce0] bg-[#f8f9fa] text-[#3c4043] hover:bg-[#ebeef1]'}`}
                >
                  <div className="font-semibold">{p.user}</div>
                  <div className="text-[10px] text-[#5f6368]">{p.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#80868b]">
          Warehouse Stock & Shipment Management System &bull; MySQL Concurrency Protected
        </div>
      </div>
    </div>
  );
};
