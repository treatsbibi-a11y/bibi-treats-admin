'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'bibi-admin-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(pref: ThemePreference): ResolvedTheme {
  const resolved = pref === 'system' ? getSystemTheme() : pref;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', pref === 'system' ? 'light dark' : resolved);
    }
  }
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    let initialPref: ThemePreference = 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        initialPref = stored;
      }
    } catch {}

    setPreference(initialPref);
    setResolvedTheme(applyThemeToDocument(initialPref));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      setPreference((current) => {
        if (current === 'system') {
          setResolvedTheme(applyThemeToDocument('system'));
        }
        return current;
      });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next: ThemePreference =
        e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'system';
      setPreference(next);
      setResolvedTheme(applyThemeToDocument(next));
    };

    media.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      media.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    const resolved = applyThemeToDocument(next);
    setResolvedTheme(resolved);
    try {
      if (next === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const sys = getSystemTheme();
    const target: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    // Returning to match current OS preference clears explicit override
    if (target === sys) {
      setTheme('system');
    } else {
      setTheme(target);
    }
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
