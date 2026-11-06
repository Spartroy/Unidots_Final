import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips, Pager, SearchField } from '../../design/controls';
import { DataTable, EmptyState, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import { ClaimBadge, OPEN_STATUSES, useDate } from '../../components/claims/ClaimBits';

const PAGE = 10;

// Claims list. The server already limits it to what this role may see.
const ClaimsList = () => {
  const { user } = useContext(AuthContext);
  const { t, dir } = useLanguage();
  const date = useDate();
  const base = `/${user.role}/claims`;
  const isClient = user.role === 'client';
  const isManager = user.role === 'manager';

  const [claims, setClaims] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const actions = useMemo(
    () => (isClient ? <Link to={`${base}/new`} className="ud-btn ud-btn-primary">{t('cl.new')}</Link> : null),
    [isClient, base, t]
  );
  usePageChrome({ subtitle: t(isClient ? 'cl.subtitle.list' : 'cl.subtitle.staff'), actions });

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [filter]);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/api/claims${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      const list = Array.isArray(r.data) ? r.data : r.data?.claims;
      setClaims(Array.isArray(list) ? list : []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('cl.loadError'));
    }
  }, [query, t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const counts = useMemo(() => {
    const all = claims || [];
    return { unassigned: all.filter((c) => !c.assignedTo && OPEN_STATUSES.includes(c.status)).length, all: all.length, open: all.filter((c) => OPEN_STATUSES.includes(c.status)).length, resolved: all.filter((c) => !OPEN_STATUSES.includes(c.status)).length };
  }, [claims]);
  const shown = useMemo(() => (claims || []).filter((c) => (filter === 'all' ? true : filter === 'unassigned' ? !c.assignedTo && OPEN_STATUSES.includes(c.status) : filter === 'open' ? OPEN_STATUSES.includes(c.status) : !OPEN_STATUSES.includes(c.status))), [claims, filter]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const slice = shown.slice((page - 1) * PAGE, page * PAGE);

  const rows = slice.map((c) => ({
    n: <Link className="ud-link" to={`${base}/${c._id}`}>{c.claimNumber || '—'}</Link>,
    t: c.title,
    c: c.client?.name || '—',
    a: c.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>{t('cl.detail.unassigned')}</span>,
    o: c.order?.orderNumber || '—',
    y: t(`cl.type.${c.claimType}`) === `cl.type.${c.claimType}` ? c.claimType : t(`cl.type.${c.claimType}`),
    s: <ClaimBadge status={c.status} />,
    d: date(c.createdAt),
  }));

  return (
    <>
      <Chips dir={dir} label={t('nav.claims')} value={filter} onChange={setFilter} items={['all', 'open', ...(isManager ? ['unassigned'] : []), 'resolved'].map((k) => ({ key: k, label: t(`cl.filter.${k}`), count: claims ? counts[k] : undefined }))} />
      <div style={{ maxWidth: 420 }}>
        <SearchField dir={dir} label={t('cl.search')} placeholder={t('cl.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && !claims && <Notice tone="error">{error}</Notice>}
      {!claims && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>}
      {claims && shown.length === 0 && (
        <EmptyState
          dir={dir}
          title={query || filter !== 'all' ? t('cl.emptyNoMatch') : t('cl.empty')}
          action={isClient && !query && filter === 'all' ? <Link to={`${base}/new`} className="ud-btn ud-btn-primary">{t('cl.new')}</Link> : null}
        >
          {isClient && !query && filter === 'all' ? t('cl.emptyClient') : null}
        </EmptyState>
      )}
      {claims && shown.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.claims')}
            columns={[
              { key: 'n', label: t('cl.col.claim') },
              { key: 't', label: t('cl.col.title') },
              ...(isClient ? [] : [{ key: 'c', label: t('cl.col.client') }]),
              { key: 'o', label: t('cl.col.order') },
              { key: 'y', label: t('cl.col.type') },
              { key: 's', label: t('cl.col.status') },
              ...(isClient ? [] : [{ key: 'a', label: t('cl.col.assigned') }]),
              { key: 'd', label: t('cl.col.date') },
            ]}
            rows={rows}
          />
        </div>
      )}
      {shown.length > PAGE && (
        <Pager dir={dir} page={page} pages={pages} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE + 1, to: Math.min(page * PAGE, shown.length), total: shown.length })} />
      )}
    </>
  );
};

export default ClaimsList;
