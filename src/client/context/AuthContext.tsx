import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../packages/shared/src/types';
import { TaskFlowApiClient } from '../../../packages/shared/src/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  apiClient: TaskFlowApiClient;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
}

const webTokenStorage = {
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('taskmaster_token') : null),
  setToken: (t: string | null) => {
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('taskmaster_token', t);
      else localStorage.removeItem('taskmaster_token');
    }
  },
};

const apiClient = new TaskFlowApiClient('/api', webTokenStorage.getToken(), webTokenStorage);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(webTokenStorage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (token) {
        try {
          const res = await apiClient.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          await apiClient.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    fetchUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await apiClient.login(email, pass);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await apiClient.register(email, pass, name);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await apiClient.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, apiClient, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
