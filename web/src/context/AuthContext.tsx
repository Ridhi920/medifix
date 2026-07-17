import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const VENDOR_ROLE_VALUES = [
  'doctor',
  'dentist',
  'lab',
  'ambulance',
  'nurse',
  'physiotherapist',
  'pharmacy',
];

export const isVendorRole = (role?: string | null) =>
  !!role && VENDOR_ROLE_VALUES.includes(role);

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (activeToken: string) => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    setUser(response.data);
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          await fetchUser(token);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('adminToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  // Re-fetch the current user (e.g. after they edit their own profile) so
  // the header/name shown around the app stays in sync.
  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      // Web portal accepts admins and approved vendors only
      if (userData.role !== 'admin' && !isVendorRole(userData.role)) {
        throw new Error('This portal is for admins and vendors only');
      }

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('adminToken', access_token);
      return userData;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
