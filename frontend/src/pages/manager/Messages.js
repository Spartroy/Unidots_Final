import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips } from '../../design/controls';
import { Button, EmptyState, Notice, StatusBadge } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';

const FILTERS = ['new', 'handled', 'all'];

// Inbox for messages sent from the public website contact form.
const Messages = () => {
  const { t, lang, dir } = useLanguage();
  const [messages, setMessages] = useState(null);
  const [filter, setFilter] = useState('new');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  usePageChrome({});

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/contact');
      setMessages(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('messages.loadError'));
    }
  }, [t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const setStatus = async (msg, status) => {
    try {
      setBusyId(msg._id);
      const r = await api.put(`/api/contact/${msg._id}`, { status });
      setMessages((list) => list.map((m) => (m._id === msg._id ? r.data : m)));
    } catch (e) {
      toast.error(e.response?.data?.message || t('messages.updateError'));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !messages) return <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>;
  if (!messages) return <div role="status" aria-label={t('common.loading')}><Skeleton height={260} /></div>;

  const newCount = messages.filter((m) => m.status === 'new').length;
  const shown = filter === 'all' ? messages : messages.filter((m) => m.status === filter);

  return (
    <>
      <Chips dir={dir} label={t('messages.filters')} value={filter} onChange={setFilter} items={FILTERS.map((f) => ({ key: f, label: t(`messages.filter.${f}`), count: f === 'new' && newCount > 0 ? newCount : undefined }))} />

      {shown.length === 0 ? (
        <EmptyState dir={dir} title={t('messages.empty')} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, maxWidth: 820 }} dir={dir}>
          {shown.map((m, i) => (
            <li key={m._id} className="ud-card ud-rise" style={{ '--i': Math.min(i, 8), display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 className="ud-card-h">{m.name}</h3>
                  <p className="ud-card-s" style={{ overflowWrap: 'anywhere' }}>
                    <a className="ud-link" href={`mailto:${m.email}`} dir="ltr">{m.email}</a>
                    {m.phone && <> · <a className="ud-link" href={`tel:${m.phone}`} dir="ltr">{m.phone}</a></>}
                  </p>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <StatusBadge status={m.status === 'new' ? 'submitted' : 'completed'} label={t(`messages.filter.${m.status}`)} />
                  <p className="ud-hint" style={{ margin: '4px 0 0' }}>{new Date(m.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.message}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a className="ud-btn ud-btn-secondary" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to UniDots')}`}>{t('messages.reply')}</a>
                <Button disabled={busyId === m._id} onClick={() => setStatus(m, m.status === 'new' ? 'handled' : 'new')}>
                  {m.status === 'new' ? t('messages.markHandled') : t('messages.markNew')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Messages;
