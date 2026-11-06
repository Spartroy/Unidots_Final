import React from 'react';
import { ToastContainer } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Toasts follow the light/dark theme and the text direction (they open on the inline-end side).
const ThemedToasts = () => {
  const { theme } = useTheme();
  const { dir } = useLanguage();
  return <ToastContainer position="top-right" autoClose={5000} theme={theme === 'dark' ? 'dark' : 'light'} rtl={dir === 'rtl'} />;
};

export default ThemedToasts;
