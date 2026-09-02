import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('care_sync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('care_sync_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('care_sync_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('care_sync_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { user: authUser, token: authToken } = res.data.data;
      setUser(authUser);
      setToken(authToken);
      localStorage.setItem('care_sync_token', authToken);
      localStorage.setItem('care_sync_user', JSON.stringify(authUser));
      return authUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('care_sync_token');
    localStorage.removeItem('care_sync_user');
  };

  const isFrontDesk = user?.role === 'FRONT_DESK';
  const isProvider = user?.role === 'PROVIDER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isFrontDesk,
        isProvider,
        isAuthenticated: !!token && !!user,
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
