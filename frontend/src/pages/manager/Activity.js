import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips, Pager } from '../../design/controls';
import { DataTable, Notice, EmptyState, Shape } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';

const PAGE_SIZE = 25;
const FILTERS = {
  all: {},
  order: { entityType: 'order' },
  file: { action: 'file' },
  auth: { entityType: 'auth' },
  user: { entityType: 'user' },
  denied: { outcome: 'denied' },
};

const RESULT_STYLE = {
  success: { background: 'var(--status-completed-bg)', color: 'var(--status-completed-fg)', shape: 'check' },
  denied: { background: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-fg)', shape: 'x' },
  failed: { background: 'var(--status-on-hold-bg)', color: 'var(--status-on-hold-fg)', shape: 'pause' },
};

// Manager: the append-only record of who did what. Read-only by design.
const Activity = () => {
  const { t, lang, dir } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  usePageChrome({ subtitle: t('activity.help') });

  useEffect(() => setPage(1), [filter]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), ...FILTERS[filter] });
      const res = await api.get(`/api/audit?${params.toString()}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('activity.loadError'));
    }
  }, [page, filter, t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const when = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  const rows = (data?.events || []).map((e) => {
    const r = RESULT_STYLE[e.outcome] || RESULT_STYLE.success;
    return {
      w: when(e.createdAt),
      p: e.actorName ? `${e.actorName}${e.actorRole ? ` (${t(`role.${e.actorRole}`)})` : ''}` : '—',
      a: t(`activity.action.${e.action}`) === `activity.action.${e.action}` ? e.action : t(`activity.action.${e.action}`),
      r: e.entityLabel || '—',
      d: e.details || '',
      s: (
        <span className="ud-badge" style={{ background: r.background, color: r.color }}>
          <Shape shape={r.shape} />
          {t(`activity.result.${e.outcome || 'success'}`)}
        </span>
      ),
    };
  });

  return (
    <>
      <Chips dir={dir} label={t('nav.activity')} value={filter} onChange={setFilter} items={Object.keys(FILTERS).map((k) => ({ key: k, label: t(`activity.filter.${k}`) }))} />
      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && <Skeleton height={320} />}
      {data && data.events.length === 0 && <EmptyState dir={dir} title={t('activity.empty')} />}
      {data && data.events.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.activity')}
            columns={[
              { key: 'w', label: t('activity.col.time') },
              { key: 'p', label: t('activity.col.person') },
              { key: 'a', label: t('activity.col.action') },
              { key: 'r', label: t('activity.col.record') },
              { key: 'd', label: t('activity.col.details') },
              { key: 's', label: t('activity.col.result') },
            ]}
            rows={rows}
          />
        </div>
      )}
      {data && data.total > PAGE_SIZE && (
        <Pager dir={dir} page={page} pages={data.pages} onPage={setPage} summary={t('px.showing', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, data.total), total: data.total })} />
      )}
    </>
  );
};

export default Activity;
