import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { Chips, Pager } from '../../design/controls';
import { Progress, Notice, EmptyState, Button } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import { PROCESS_KEYS } from '../../components/prepress/ProcessGrid';

const PAGE_SIZE = 6;
const doneCount = (o) => PROCESS_KEYS.filter((k) => o.stages?.prepress?.subProcesses?.[k]?.status === 'Completed').length;

// Prepress home: the orders on the floor, with progress and the three numbers that matter.
const PrepressOrders = () => {
  const { t, lang, dir } = useLanguage();
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('current');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([api.get('/api/orders?status=In Prepress&limit=100'), api.get('/api/orders?status=Completed&limit=100')]);
      setActive(a.data);
      setCompleted(c.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('px.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);
  useEffect(() => setPage(1), [filter]);

  const stats = useMemo(() => {
    if (!active) return null;
    const list = active.orders || [];
    const now = Date.now();
    return {
      active: active.total ?? list.length,
      ready: list.filter((o) => doneCount(o) === PROCESS_KEYS.length).length,
      late: list.filter((o) => o.deadline && new Date(o.deadline).getTime() < now).length,
      total: (active.total ?? list.length) + (completed?.total ?? 0),
    };
  }, [active, completed]);

  const shown = useMemo(() => {
    const a = active?.orders || [];
    const c = completed?.orders || [];
    const list = filter === 'current' ? a : filter === 'completed' ? c : [...a, ...c].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    return list;
  }, [active, completed, filter]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const pageItems = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (error && !active) {
    return (
      <Notice tone="error">
        {error}{' '}
        <button type="button" className="ud-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={load}>
          {t('common.retry')}
        </button>
      </Notice>
    );
  }
  if (!active) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={44} width={360} />
        <div className="ud-grid ud-grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} height={110} />)}</div>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={84} />)}
      </div>
    );
  }

  return (
    <>
      <Chips
        dir={dir}
        label={t('nav.orders')}
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'current', label: t('px.filter.current'), count: stats.active },
          { key: 'completed', label: t('px.filter.completed'), count: completed?.total ?? 0 },
          { key: 'all', label: t('px.filter.all'), count: stats.total },
        ]}
      />

      <div className="ud-grid ud-grid-3" dir={dir}>
        {[
          ['active', stats.active, t('px.kpi.activeNote', { total: stats.total }), false],
          ['ready', stats.ready, t('px.kpi.readyNote'), false],
          ['late', stats.late, t('px.kpi.lateNote'), stats.late > 0],
        ].map(([k, value, note, attention], i) => (
          <div key={k} className="ud-card ud-kpi ud-root ud-rise" style={{ '--i': i }}>
            <span className="ud-kpi-label">{t(`px.kpi.${k}`)}</span>
            <span className="ud-kpi-value" style={attention ? { color: 'var(--danger)' } : undefined}>{value}</span>
            <span className="ud-kpi-delta">{note}</span>
          </div>
        ))}
      </div>

      {pageItems.length === 0 ? (
        <EmptyState dir={dir} title={t('px.empty')}>{t('px.emptyText')}</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pageItems.map((o, i) => {
            const n = doneCount(o);
            return (
              <li key={o._id} className="ud-card ud-root ud-rise" dir={dir} style={{ '--i': i, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 220, flex: '1 1 260px' }}>
                  <div className="ud-order-no">{o.orderNumber} · {o.title}</div>
                  <div style={{ color: 'var(--text-muted)', marginBlockStart: 2 }}>
                    {t('px.client')}: {o.client?.name || '—'} · {t('px.received')}: {fmt(o.createdAt)}
                  </div>
                </div>
                <div style={{ flex: '1 1 220px', maxWidth: 360 }}>
                  <Progress dir={dir} label={t('px.processesDone')} value={Math.round((n / PROCESS_KEYS.length) * 100)} />
                </div>
                <Link to={`/prepress/orders/${o._id}`} className="ud-btn ud-btn-primary ud-btn-lg">{t('px.details')}</Link>
              </li>
            );
          })}
        </ul>
      )}

      {shown.length > PAGE_SIZE && (
        <Pager
          dir={dir}
          page={page}
          pages={pages}
          onPage={setPage}
          summary={t('px.showing', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, shown.length), total: shown.length })}
        />
      )}
    </>
  );
};

export default PrepressOrders;
