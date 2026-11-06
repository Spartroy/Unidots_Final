import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../design/kit';
import OrderStatusBadge from './OrderStatusBadge';

const Icon = ({ d }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const CHAT = 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155';

// A small "find my order" helper for clients: search by number or name, or list the latest orders.
// (It used to guess intent from English sentences, which could never work in Arabic.)
const ChatBot = () => {
  const { t, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [state, setState] = useState({ status: 'idle', orders: [], label: '' });
  const input = useRef(null);
  const fab = useRef(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fab.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const run = async (fn, label, emptyKey) => {
    setState({ status: 'loading', orders: [], label: '' });
    try {
      const orders = await fn();
      setState({ status: orders.length ? 'done' : 'empty', orders, label: orders.length ? label(orders.length) : t(emptyKey, { q: q.trim() }) });
    } catch (e) {
      setState({ status: 'error', orders: [], label: t('ch.bot.error') });
    }
  };
  const search = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    run(async () => (await api.get(`/api/orders/chatbot?search=${encodeURIComponent(q.trim())}`)).data.orders || [], (n) => t('ch.bot.results', { n }), 'ch.bot.none');
  };
  const recent = () => run(async () => (await api.get('/api/orders/recent')).data || [], (n) => t('ch.bot.results', { n }), 'ch.bot.noRecent');

  return (
    <>
      <button ref={fab} type="button" className="ud-chatfab" aria-label={t('ch.bot.open')} aria-expanded={open} aria-controls="order-finder" onClick={() => setOpen((v) => !v)}>
        <Icon d={CHAT} />
      </button>
      {open && (
        <section id="order-finder" className="ud-chatpanel ud-root" role="dialog" aria-label={t('ch.bot.title')} dir={dir}>
          <header>
            <h2>{t('ch.bot.title')}</h2>
            <button type="button" className="ud-notif-act" aria-label={t('ch.bot.close')} onClick={() => setOpen(false)}>×</button>
          </header>
          <p className="ud-card-s" style={{ margin: 0 }}>{t('ch.bot.hint')}</p>
          <form onSubmit={search} style={{ display: 'flex', gap: 8 }}>
            <input ref={input} className="ud-input" aria-label={t('ch.bot.search')} placeholder={t('ch.bot.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <Button type="submit" disabled={!q.trim() || state.status === 'loading'}>{t('ch.bot.go')}</Button>
          </form>
          <div><Button variant="secondary" onClick={recent} disabled={state.status === 'loading'}>{t('ch.bot.recent')}</Button></div>
          <div aria-live="polite" className="ud-chatresults">
            {state.status === 'loading' && <p className="ud-card-s">{t('ch.bot.loading')}</p>}
            {['empty', 'error'].includes(state.status) && <p className="ud-card-s">{state.label}</p>}
            {state.status === 'done' && (
              <>
                <p className="ud-hint" style={{ margin: '0 0 8px' }}>{state.label}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {state.orders.map((o) => (
                    <li key={o._id} className="ud-chatorder">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <b dir="ltr">{o.orderNumber}</b>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <div style={{ overflowWrap: 'anywhere' }}>{o.title}</div>
                      {o.nextStep && <div className="ud-hint">{t('ch.bot.next')}: {o.nextStep}</div>}
                      <Link className="ud-link" to={`/client/orders/${o._id}`} onClick={() => setOpen(false)}>{t('ch.bot.view')}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {state.status === 'empty' && <Link className="ud-link" to="/client/orders/new" onClick={() => setOpen(false)}>{t('ch.bot.new')}</Link>}
          </div>
        </section>
      )}
    </>
  );
};

export default ChatBot;
