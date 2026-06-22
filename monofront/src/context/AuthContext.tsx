import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogin, apiLogout, apiGetCurrentUser } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetCurrentUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (login: string, password: string) => {
    const result = await apiLogin(login, password);
    if (result.ok && result.user) setUser(result.user);
    return { ok: result.ok, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
