import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import logoWhite from '../assets/logo-white.png';
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
import acidEn from '../locales/acid.en';
import acidAr from '../locales/acid.ar';
import platesEn from '../locales/plates.en';
import platesAr from '../locales/plates.ar';
import notifEn from '../locales/notif.en';
import notifAr from '../locales/notif.ar';
import chatEn from '../locales/chat.en';
import chatAr from '../locales/chat.ar';
import detectorEn from '../locales/detector.en';
import detectorAr from '../locales/detector.ar';

const dictionaries = { en: { ...en, ...landingEn, ...phase5En, ...prepressEn, ...activityEn, ...courierEn, ...ordersEn, ...managerEn, ...accountEn, ...profileEn, ...claimsEn, ...clientOrderEn, ...wizEn, ...peopleEn, ...tasksEn, ...mreportsEn, ...barrelsEn, ...empworkEn, ...templatesEn, ...acidEn, ...platesEn, ...notifEn, ...chatEn, ...detectorEn }, ar: { ...ar, ...landingAr, ...phase5Ar, ...prepressAr, ...activityAr, ...courierAr, ...ordersAr, ...managerAr, ...accountAr, ...profileAr, ...claimsAr, ...clientOrderAr, ...wizAr, ...peopleAr, ...tasksAr, ...mreportsAr, ...barrelsAr, ...empworkAr, ...templatesAr, ...acidAr, ...platesAr, ...notifAr, ...chatAr, ...detectorAr } };
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

  const apply = useCallback((next) => {
    setChosen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  // Switching language shows a short full-screen transition so the swap of text and direction
  // never looks like a broken layout. Reduced-motion users get an instant switch.
  const [switching, setSwitching] = useState(null); // { to, leaving }
  const timers = useRef([]);
  const setLang = useCallback(
    (next) => {
      if (next === lang || switching) return;
      const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return apply(next);
      setSwitching({ to: next, leaving: false });
      timers.current.push(setTimeout(() => apply(next), 320));
      timers.current.push(setTimeout(() => setSwitching({ to: next, leaving: true }), 1000));
      timers.current.push(setTimeout(() => setSwitching(null), 1350));
    },
    [lang, switching, apply]
  );
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {switching && (
        <div
          className="ud-langswitch"
          data-leaving={switching.leaving ? 'true' : 'false'}
          dir={switching.to === 'ar' ? 'rtl' : 'ltr'}
          lang={switching.to}
          role="status"
          aria-live="polite"
        >
          <div className="ud-langswitch-inner">
            <img src={logoWhite} alt="" width="132" height="auto" />
            <div className="ud-langswitch-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p>{dictionaries[switching.to]['lang.switching']}</p>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
