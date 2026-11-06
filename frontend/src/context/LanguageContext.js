import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext from './AuthContext';
import en from '../locales/en';
import ar from '../locales/ar';
import landingEn from '../locales/landing.en';
import landingAr from '../locales/landing.ar';

const dictionaries = { en: { ...en, ...landingEn }, ar: { ...ar, ...landingAr } };
const STORAGE_KEY = 'unidots_lang';

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'ar' || v === 'en' ? v : null;
  } catch (_) {
    return null;
  }
};

const LanguageContext = createContext({
  lang: 'en',
  dir: 'ltr',
  t: (key) => en[key] || key,
  setLang: () => {},
  toggleLang: () => {},
});

export const LanguageProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [chosen, setChosen] = useState(readStored);

  // An explicit choice always wins. Otherwise prepress staff start in Arabic, everyone else in English.
  const lang = chosen || (user?.role === 'prepress' ? 'ar' : 'en');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  const toggleLang = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang]);

  // t('nav.orders') -> current language, then English, then the key itself.
  // Optional {name} placeholders: t('hello', { name: 'Sam' }) with 'Hello {name}'.
  const t = useCallback(
    (key, vars) => {
      let text = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, dir, t, setLang, toggleLang }), [lang, dir, t, setLang, toggleLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
