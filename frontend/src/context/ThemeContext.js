import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'unidots_theme';

const read = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : 'light';
  } catch (_) {
    return 'light';
  }
};

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

// Light by default; the choice is remembered on this device.
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // crossfade colours once instead of snapping
    const root = document.documentElement;
    root.classList.add('ud-theme-fade');
    window.setTimeout(() => root.classList.remove('ud-theme-fade'), 400);
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (_) {}
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
