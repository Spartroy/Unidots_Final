import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import NotificationContext from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const TONE = { success: 'completed', warning: 'submitted', error: 'cancelled', info: 'designing' };
const PANEL_W = 380;
const GAP = 8;

// Bell + panel. The panel is drawn in a portal on top of everything and kept inside the screen,
// so it never hides behind the page header or runs off the edge, in either text direction.
const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const button = useRef(null);
  const panel = useRef(null);

  const place = useCallback(() => {
    const b = button.current?.getBoundingClientRect();
    if (!b) return;
    const vw = window.innerWidth;
    const width = Math.min(PANEL_W, vw - GAP * 2);
    const rtl = dir === 'rtl';
    // line the panel's end edge up with the bell, then keep it on screen
    let left = rtl ? b.left : b.right - width;
    left = Math.max(GAP, Math.min(left, vw - width - GAP));
    const top = Math.min(b.bottom + GAP, window.innerHeight - 160);
    setPos({ left, top, width, maxHeight: window.innerHeight - top - GAP });
  }, [dir]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e) => {
      if (panel.current?.contains(e.target) || button.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  const ago = (d) => {
    const secs = Math.round((new Date(d).getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-EG' : 'en', { numeric: 'auto' });
    const abs = Math.abs(secs);
    if (abs < 60) return rtf.format(0, 'second');
    if (abs < 3600) return rtf.format(Math.round(secs / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(secs / 3600), 'hour');
    if (abs < 604800) return rtf.format(Math.round(secs / 86400), 'day');
    return new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' });
  };

  const openItem = (n) => {
    if (!n.read) markAsRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className="ud-bell"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? t('nt.openUnread', { n: unreadCount }) : t('nt.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="ud-bell-n" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={panel}
            className="ud-notif ud-root"
            role="dialog"
            aria-label={t('nt.title')}
            tabIndex={-1}
            dir={dir}
            style={{ left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxHeight }}
          >
            <div className="ud-notif-head">
              <h2>{t('nt.title')}</h2>
              {unreadCount > 0 && <button type="button" className="ud-link" onClick={markAllAsRead}>{t('nt.markAll')}</button>}
            </div>
            {notifications.length === 0 ? (
              <div className="ud-notif-empty">
                <strong>{t('nt.empty')}</strong>
                <span>{t('nt.emptyText')}</span>
              </div>
            ) : (
              <ul className="ud-notif-list">
                {notifications.map((n) => (
                  <li key={n._id} data-unread={!n.read ? 'true' : 'false'}>
                    <button type="button" className="ud-notif-item" onClick={() => openItem(n)}>
                      <span className="ud-notif-dot" aria-hidden="true" style={{ background: `var(--status-${TONE[n.type] || 'designing'}-fg)` }} />
                      <span className="ud-notif-body">
                        <span className="ud-notif-meta">
                          <span style={{ color: `var(--status-${TONE[n.type] || 'designing'}-fg)`, fontWeight: 600 }}>{t(`nt.type.${n.type}`) === `nt.type.${n.type}` ? t('nt.type.info') : t(`nt.type.${n.type}`)}</span>
                          <span>{ago(n.createdAt)}</span>
                        </span>
                        <b>{n.title}</b>
                        <span className="ud-notif-text">{n.message}</span>
                        {!n.read && <span className="ud-sr">{t('nt.unread')}</span>}
                      </span>
                    </button>
                    <span className="ud-notif-actions">
                      {!n.read && <button type="button" className="ud-notif-act" aria-label={t('nt.markRead')} title={t('nt.markRead')} onClick={() => markAsRead(n._id)}>✓</button>}
                      <button type="button" className="ud-notif-act" aria-label={t('nt.delete')} title={t('nt.delete')} onClick={() => deleteNotification(n._id)}>×</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationDropdown;
