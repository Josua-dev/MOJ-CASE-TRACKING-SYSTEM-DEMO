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
    // Verify token with backend on mount
    const storedToken = localStorage.getItem('moj_token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      axios.get('/api/auth/me')
        .then(({ data }) => {
          if (data.success) {
            setUser(data.data.user);
            localStorage.setItem('moj_user', JSON.stringify(data.data.user));
          } else {
            localStorage.removeItem('moj_token');
            localStorage.removeItem('moj_user');
            delete axios.defaults.headers.common['Authorization'];
          }
        })
        .catch(() => {
          localStorage.removeItem('moj_token');
          localStorage.removeItem('moj_user');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
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
