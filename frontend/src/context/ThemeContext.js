import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('moj-theme') || 'system';
  });

  const [resolved, setResolved] = useState('light');

  const applyTheme = useCallback((t) => {
    const isDark = t === 'dark' || (t === 'system' && getSystemTheme() === 'dark');
    const r = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', r);
    setResolved(r);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  function setAndPersist(t) {
    setTheme(t);
    localStorage.setItem('moj-theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme: setAndPersist }}>
      {children}
    </ThemeContext.Provider>
  );
}
