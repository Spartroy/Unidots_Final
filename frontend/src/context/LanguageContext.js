import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext from './AuthContext';
import en from '../locales/en';
import ar from '../locales/ar';
import landingEn from '../locales/landing.en';
import landingAr from '../locales/landing.ar';
import phase5En from '../locales/phase5.en';
import phase5Ar from '../locales/phase5.ar';
import prepressEn from '../locales/prepress.en';
import prepressAr from '../locales/prepress.ar';
import activityEn from '../locales/activity.en';
import activityAr from '../locales/activity.ar';
import courierEn from '../locales/courier.en';
import courierAr from '../locales/courier.ar';
import ordersEn from '../locales/orders.en';
import ordersAr from '../locales/orders.ar';
import managerEn from '../locales/manager.en';
import managerAr from '../locales/manager.ar';
import accountEn from '../locales/account.en';
import accountAr from '../locales/account.ar';
import profileEn from '../locales/profile.en';
import profileAr from '../locales/profile.ar';
import claimsEn from '../locales/claims.en';
import claimsAr from '../locales/claims.ar';
import clientOrderEn from '../locales/clientorder.en';
import clientOrderAr from '../locales/clientorder.ar';
import wizEn from '../locales/wiz.en';
import wizAr from '../locales/wiz.ar';
import peopleEn from '../locales/people.en';
import peopleAr from '../locales/people.ar';
import tasksEn from '../locales/tasks.en';
import tasksAr from '../locales/tasks.ar';
import mreportsEn from '../locales/mreports.en';
import mreportsAr from '../locales/mreports.ar';
import barrelsEn from '../locales/barrels.en';
import barrelsAr from '../locales/barrels.ar';
import empworkEn from '../locales/empwork.en';
import empworkAr from '../locales/empwork.ar';
import templatesEn from '../locales/templates.en';
import templatesAr from '../locales/templates.ar';

const dictionaries = { en: { ...en, ...landingEn, ...phase5En, ...prepressEn, ...activityEn, ...courierEn, ...ordersEn, ...managerEn, ...accountEn, ...profileEn, ...claimsEn, ...clientOrderEn, ...wizEn, ...peopleEn, ...tasksEn, ...mreportsEn, ...barrelsEn, ...empworkEn, ...templatesEn }, ar: { ...ar, ...landingAr, ...phase5Ar, ...prepressAr, ...activityAr, ...courierAr, ...ordersAr, ...managerAr, ...accountAr, ...profileAr, ...claimsAr, ...clientOrderAr, ...wizAr, ...peopleAr, ...tasksAr, ...mreportsAr, ...barrelsAr, ...empworkAr, ...templatesAr } };
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
