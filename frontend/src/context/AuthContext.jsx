import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('opd_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('opd_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('opd_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('opd_token', newToken);
    localStorage.setItem('opd_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('opd_token', newToken);
    localStorage.setItem('opd_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('opd_token');
    localStorage.removeItem('opd_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
