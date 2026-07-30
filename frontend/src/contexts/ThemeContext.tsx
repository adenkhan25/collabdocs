'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('collabdocs_theme') : null;
    const initial = (stored as 'light' | 'dark') || user?.theme || 'light';
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      applyTheme(user.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme]);

  const applyTheme = (value: 'light' | 'dark') => {
    setThemeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('collabdocs_theme', value);
      if (value === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const setTheme = async (value: 'light' | 'dark') => {
    applyTheme(value);
    updateUser({ theme: value });
    try {
      await api.put('/auth/theme', { theme: value });
    } catch (error) {
      // non-fatal
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
