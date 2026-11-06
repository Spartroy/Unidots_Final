import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../shell/PortalShell';
import { Chips, Pager, SearchField } from '../../design/controls';
import { DataTable, Notice, EmptyState } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import OrderStatusBadge from '../common/OrderStatusBadge';

const PAGE_SIZE = 10;

// filter key -> API query. "active" excludes cancelled orders.
const FILTERS = {
  all: {},
  active: { 'status[ne]': 'Cancelled' },
  submitted: { status: 'Submitted' },
  awaiting: { status: 'Awaiting Approval' },
  designing: { status: 'Designing' },
  designDone: { status: 'Design Done' },
  inPrepress: { status: 'In Prepress' },
  completed: { status: 'Completed' },
  cancelled: { status: 'Cancelled' },
};
const FROM_STATUS = { Submitted: 'submitted', 'Awaiting Approval': 'awaiting', Designing: 'designing', 'Design Done': 'designDone', 'In Prepress': 'inPrepress', Completed: 'completed', Cancelled: 'cancelled' };

/**
 * One order list for the Client and Employee portals.
 * client: cards with Reorder and View details. employee: a table with client and deadline.
 */
const OrdersList = ({ portal }) => {
  const isClient = portal === 'client';
  const base = `/${portal}/orders`;
  const chipKeys = isClient ? ['all', 'submitted', 'awaiting', 'designing', 'inPrepress', 'completed', 'cancelled'] : ['active', 'designing', 'designDone', 'inPrepress', 'completed', 'cancelled'];
  const { t, lang, dir } = useLanguage();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(FROM_STATUS[params.get('status')] && chipKeys.includes(FROM_STATUS[params.get('status')]) ? FROM_STATUS[params.get('status')] : chipKeys[0]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  usePageChrome({
    subtitle: t(`ol.subtitle.${portal}`),
    actions: isClient ? <Link to="/client/orders/new" className="ud-btn ud-btn-primary">{t('ol.newOrder')}</Link> : undefined,
  });

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [filter]);

  // Counts on the chips come from the client statistics endpoint (only where it has them)
  useEffect(() => {
    if (!isClient) return;
    api
      .get('/api/orders/client-stats')
      .then((r) => setCounts({ all: r.data.totalOrders, submitted: r.data.submittedOrders, designing: r.data.inDesignOrders, inPrepress: r.data.inPrepressOrders, completed: r.data.completedOrders }))
      .catch(() => {});
  }, [isClient]);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), ...FILTERS[filter] });
      if (query) p.set('search', query);
      const res = await api.get(`/api/orders?${p.toString()}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('ol.loadError'));
    }
  }, [page, filter, query, t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const orders = data?.orders || [];

  return (
    <>
      <Chips
        dir={dir}
        label={t('nav.orders')}
        value={filter}
        onChange={setFilter}
        items={chipKeys.map((k) => ({ key: k, label: t(`ol.filter.${k}`), count: counts && counts[k] !== undefined ? counts[k] : undefined }))}
      />
      <div style={{ maxWidth: 520 }}>
        <SearchField dir={dir} label={t('ol.search')} placeholder={t('ol.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && (
        <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={76} />)}
        </div>
      )}
      {data && orders.length === 0 && (
        <EmptyState dir={dir} title={t('ol.empty')} action={isClient ? <Link to="/client/orders/new" className="ud-btn ud-btn-primary">{t('ol.newOrder')}</Link> : null}>
          {isClient ? t('ol.emptyClient') : t('ol.emptyStaff')}
        </EmptyState>
      )}

      {data && orders.length > 0 && isClient && (
        <ul className="ud-card ud-pad0 ud-rise" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {orders.map((o, i) => (
            <li key={o._id} className="ud-root" dir={dir} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '14px 16px', borderBlockStart: i ? '1px solid var(--border)' : 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link className="ud-link ud-order-no" to={`${base}/${o._id}`}>{o.orderNumber}</Link>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{o.title} · {t('ol.ordered', { date: fmt(o.createdAt) })}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/client/orders/new" state={{ reorderFrom: o }} className="ud-btn ud-btn-secondary">{t('ol.reorder')}</Link>
                <Link to={`${base}/${o._id}`} className="ud-btn ud-btn-secondary">{t('ol.viewDetails')}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && orders.length > 0 && !isClient && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.orders')}
            columns={[
              { key: 'o', label: t('ol.col.order') },
              { key: 't', label: t('ol.col.title') },
              { key: 'c', label: t('ol.col.client') },
              { key: 'd', label: t('ol.col.deadline') },
              { key: 's', label: t('ol.col.status') },
            ]}
            rows={orders.map((o) => ({
              o: <Link className="ud-link" to={`${base}/${o._id}`}>{o.orderNumber}</Link>,
              t: o.title,
              c: o.client?.name || '—',
              d: o.deadline ? fmt(o.deadline) : t('ol.noDeadline'),
              s: <OrderStatusBadge status={o.status} />,
            }))}
          />
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <Pager dir={dir} page={page} pages={data.pages} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, data.total), total: data.total })} />
      )}
    </>
  );
};

export default OrdersList;
