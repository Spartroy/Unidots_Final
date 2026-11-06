import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Small EN/AR switch. `className` lets each place (navbar, login page) set its own colours.
const LanguageToggle = ({ className = '' }) => {
  const { t, toggleLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.switchToLabel')}
      className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${className}`}
    >
      {t('lang.switchTo')}
    </button>
  );
};

export default LanguageToggle;
