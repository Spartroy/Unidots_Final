import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../common/NotificationDropdown';
import { Ico, Avatar } from '../../design/kit';
import PageTransition from './PageTransition';
import logoWhite from '../../assets/logo-white.png';

const ICONS = {
  'nav.dashboard': 'home',
  'nav.deliveries': 'truck',
  'nav.orders': 'orders',
  'nav.orderHistory': 'history',
  'nav.claims': 'claims',
  'nav.tasks': 'tasks',
  'nav.templates': 'orders',
  'nav.employees': 'people',
  'nav.clients': 'people',
  'nav.reports': 'reports',
  'nav.messages': 'chat',
  'nav.activity': 'history',
  'nav.inventory': 'production',
  'nav.priceList': 'reports',
  'nav.barrelManagement': 'production',
  'nav.plateMonitoring': 'production',
  'nav.acidSolution': 'production',
};


// Pages can add a subtitle and primary action to the page header.
const ChromeContext = createContext({ setChrome: () => {} });
export const usePageChrome = (chrome) => {
  const { setChrome } = useContext(ChromeContext);
  const { subtitle, actions, title } = chrome || {};
  useEffect(() => {
    setChrome({ subtitle, actions, title });
    return () => setChrome({});
  }, [setChrome, subtitle, actions, title]);
};

const LangGroup = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="ud-lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>عربي</button>
    </div>
  );
};

const ThemeButton = ({ className = 'ud-themebtn' }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={dark ? t('theme.toLight') : t('theme.toDark')}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        ) : (
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        )}
      </svg>
    </button>
  );
};

const ThemeSheetButton = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
    </button>
  );
};

/**
 * Shared shell for every portal (desktop sidebar + page header, phone top bar + bottom tabs).
 * portal = { key, titleKey, items: [{ labelKey, href, match? }], more?: [...], extras? }
 */
const PortalShell = ({ portal }) => {
  const { user, logout } = useContext(AuthContext);
  const { t, dir } = useLanguage();
  const { pathname } = useLocation();
  const [chrome, setChromeState] = useState({});
  const [sheet, setSheet] = useState(false);
  const setChrome = useCallback((c) => setChromeState(c || {}), []);
  const chromeValue = useMemo(() => ({ setChrome }), [setChrome]);

  useEffect(() => setSheet(false), [pathname]);

  const withCurrent = (list = []) => list.map((i) => ({ ...i, current: i.match ? i.match(pathname) : pathname.startsWith(i.href), icon: ICONS[i.labelKey] || 'home' }));
  const items = withCurrent(portal.items);
  const more = withCurrent(portal.more);
  const all = [...items, ...more];
  const active = all.find((i) => i.current);
  const title = chrome.title || (active ? t(active.labelKey) : pathname.endsWith('/profile') ? t('nav.yourProfile') : t(portal.titleKey));
  const profile = `/${portal.key}/profile`;
  const roleLabel = t(`role.${user?.role || portal.key}`);

  const tabItems = all.length > 5 ? items.slice(0, 4) : all;
  const overflow = all.length > 5 ? all.slice(4) : [];

  const navLink = (i) => (
    <Link key={i.href} to={i.href} aria-current={i.current ? 'page' : undefined}>
      {Ico(i.icon, 20)}
      <span>{t(i.labelKey)}</span>
    </Link>
  );

  return (
    <ChromeContext.Provider value={chromeValue}>
      <div className="ud-app" dir={dir}>
        <a href="#main-content" className="ud-skip">{t('nav.skipToContent')}</a>

        {/* Desktop sidebar */}
        <aside className="ud-side ud-root">
          <Link to={`/${portal.key}`} aria-label="UniDots">
            <img src={logoWhite} alt="UniDots" className="ud-logo" />
          </Link>
          <p className="ud-portal">{t(portal.titleKey)}</p>
          <nav aria-label={t('nav.mainNavigation')}>
            {items.map(navLink)}
            {more.length > 0 && <p className="ud-side-group">{t('nav.more')}</p>}
            {more.map(navLink)}
          </nav>
          <div className="ud-side-foot-wrap" style={{ marginBlockStart: 'auto' }}>
            <div className="ud-side-foot">
              <Avatar name={user?.name || 'U'} onNav />
              <div>
                <strong>{user?.name}</strong>
                <small>{roleLabel}</small>
              </div>
            </div>
            <div className="ud-side-actions">
              <Link to={profile}>{t('nav.yourProfile')}</Link>
              <button type="button" onClick={logout}>{t('nav.signOut')}</button>
            </div>
          </div>
        </aside>

        <div className="ud-app-main">
          {/* Phone top bar */}
          <header className="ud-mbar">
            <h1>{title}</h1>
            <LangGroup />
            <span className="ud-tool-bell"><NotificationDropdown /></span>
          </header>

          {/* Desktop page header (the one place the page title appears) */}
          <header className="ud-pagehead ud-root">
            <div className="ud-pagehead-text">
              <h1>{title}</h1>
              {chrome.subtitle ? <p>{chrome.subtitle}</p> : null}
            </div>
            <div className="ud-pagehead-tools">
              {chrome.actions || null}
              <span className="ud-tool-bell"><NotificationDropdown /></span>
              <LangGroup />
              <ThemeButton />
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="ud-content ud-root" data-theme={undefined}>
            <PageTransition><Outlet /></PageTransition>
          </main>
        </div>

        {portal.extras}

        {/* Phone bottom tabs */}
        <nav className="ud-mtabs" aria-label={t('nav.mainNavigation')}>
          {tabItems.map(navLink)}
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-expanded={sheet}>
            {Ico('production', 24)}
            <span>{t('nav.more')}</span>
          </button>
        </nav>

        {sheet && (
          <div className="ud-sheet" role="dialog" aria-modal="true" aria-label={t('nav.more')} onClick={() => setSheet(false)}>
            <div className="ud-sheet-panel" onClick={(e) => e.stopPropagation()}>
              {overflow.map(navLink)}
              <Link to={profile}>{Ico('user', 24)}{t('nav.yourProfile')}</Link>
              <ThemeSheetButton />
              <button type="button" onClick={logout}>{t('nav.signOut')}</button>
              <button type="button" onClick={() => setSheet(false)}>{t('shell.close')}</button>
            </div>
          </div>
        )}
      </div>
    </ChromeContext.Provider>
  );
};

export default PortalShell;
