import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';

const FILTERS = ['new', 'handled', 'all'];

// Inbox for messages sent from the public website contact form.
const Messages = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState(null);
  const [filter, setFilter] = useState('new');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/contact');
      setMessages(res.data);
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
      const res = await api.put(`/api/contact/${msg._id}`, { status });
      setMessages((list) => list.map((m) => (m._id === msg._id ? res.data : m)));
    } catch (e) {
      toast.error(e.response?.data?.message || t('messages.updateError'));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !messages) {
    return (
      <div role="alert" className="rounded-lg bg-white p-6 text-center shadow">
        <p className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={load} className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (!messages) {
    return (
      <div className="flex h-64 items-center justify-center" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const newCount = messages.filter((m) => m.status === 'new').length;
  const shown = filter === 'all' ? messages : messages.filter((m) => m.status === filter);

  return (
    <div className="space-y-4 px-4 sm:px-0">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('messages.filters')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              filter === f ? 'bg-primary-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {t(`messages.filter.${f}`)}
            {f === 'new' && newCount > 0 ? ` (${newCount})` : ''}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow">{t('messages.empty')}</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((m) => (
            <li key={m._id} className="rounded-lg bg-white p-5 shadow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-600">
                    <a href={`mailto:${m.email}`} className="text-primary-700 hover:underline">{m.email}</a>
                    {m.phone && (
                      <>
                        {' · '}
                        <a href={`tel:${m.phone}`} dir="ltr" className="text-primary-700 hover:underline">{m.phone}</a>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-end">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${m.status === 'new' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {t(`messages.filter.${m.status}`)}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-800">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to UniDots')}`}
                  className="inline-flex min-h-[44px] items-center rounded-md border border-primary-300 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  {t('messages.reply')}
                </a>
                <button
                  type="button"
                  disabled={busyId === m._id}
                  onClick={() => setStatus(m, m.status === 'new' ? 'handled' : 'new')}
                  className="inline-flex min-h-[44px] items-center rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {m.status === 'new' ? t('messages.markHandled') : t('messages.markNew')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Messages;
