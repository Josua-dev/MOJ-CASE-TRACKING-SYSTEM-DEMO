import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const storedToken = localStorage.getItem('moj_token');
    const storedUser = localStorage.getItem('moj_user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem('moj_token');
        localStorage.removeItem('moj_user');
      }
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { data } = await axios.post('/api/auth/login', { email, password });
    // data = { success: true, data: { token, user: { ... } } }
    if (!data.success) throw new Error(data.error);

    const { token, user: userData } = data.data;
    localStorage.setItem('moj_token', token);
    localStorage.setItem('moj_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('moj_token');
    localStorage.removeItem('moj_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }

  const value = { user, login, logout, loading };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
