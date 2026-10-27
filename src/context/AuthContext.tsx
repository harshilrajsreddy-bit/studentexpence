import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  startTempSession: () => Promise<void>;
  purgeTempStorage: () => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    currency?: string;
    monthlyPocketMoney?: number;
    savingsTarget?: number;
    expectedPocketDay?: number;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch {
      api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
  };

  const loginDemo = async () => {
    const data = await api.loginDemo();
    setUser(data.user);
  };

  const startTempSession = async () => {
    const data = await api.startTempSession();
    setUser(data.user);
  };

  const purgeTempStorage = async () => {
    await api.purgeTempStorage();
    api.logout();
    setUser(null);
  };

  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    currency?: string;
    monthlyPocketMoney?: number;
    savingsTarget?: number;
    expectedPocketDay?: number;
  }) => {
    const data = await api.register(payload);
    setUser(data.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updated = await api.updateProfile(updates);
    setUser(updated);
  };

  const refreshUser = async () => {
    try {
      const refreshed = await api.getCurrentUser();
      setUser(refreshed);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginDemo,
        startTempSession,
        purgeTempStorage,
        register,
        logout,
        updateProfile,
        refreshUser
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
