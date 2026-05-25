import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminApi, getToken, setToken, clearToken } from '../services/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
}

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'selliberation_admin_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate token on mount — clears stale sessions
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi.auth.me()
      .then(res => {
        if (res.success && res.data) {
          setAdmin(res.data as AdminUser);
        } else {
          clearToken();
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        clearToken();
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminApi.auth.login(email, password);
    if (res.success && res.data && res.token) {
      setToken(res.token);
      setAdmin(res.data as AdminUser);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const logout = async () => {
    await adminApi.auth.logout();
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
