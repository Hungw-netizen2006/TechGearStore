import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => void;
  quickLoginAs: (role: 'admin' | 'customer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('techgear_token'));
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('techgear_token');
      if (storedToken) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
        } catch {
          localStorage.removeItem('techgear_token');
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setToken(res.access_token);
    setCurrentUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (payload: { email: string; password: string; full_name: string; phone?: string; address?: string }) => {
    await api.register(payload);
    // Tự động đăng nhập sau khi đăng ký
    await login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem('techgear_token');
    setToken(null);
    setCurrentUser(null);
  };

  const quickLoginAs = async (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      await login('admin@techgear.vn', 'admin123456');
    } else {
      await login('hung.nv@techgear.vn', 'user123456');
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        loading,
        isAuthModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        login,
        register,
        logout,
        quickLoginAs,
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

