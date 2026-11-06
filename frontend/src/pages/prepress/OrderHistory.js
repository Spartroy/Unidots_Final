import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Chips, Pager, SearchField } from '../../design/controls';
import { DataTable, Notice, EmptyState } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';

const PAGE_SIZE = 10;
const FILTER_STATUS = { all: '', inPrepress: 'In Prepress', ready: 'Ready for Delivery', completed: 'Completed' };

// Every order that has reached the plate room: one search, one filter row, one table.
const PrepressOrderHistory = () => {
  const { t, lang, dir } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // wait for a pause in typing before asking the server
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
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (FILTER_STATUS[filter]) params.set('status', FILTER_STATUS[filter]);
      if (query) params.set('search', query);
      const res = await api.get(`/api/orders?${params.toString()}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('px.loadError'));
    }
  }, [page, filter, query, t]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = (data?.orders || []).map((o) => ({
    o: <Link className="ud-link" to={`/prepress/orders/${o._id}`}>{o.orderNumber}</Link>,
    t: o.title,
    c: o.client?.name || '—',
    d: fmt(o.createdAt),
    s: <OrderStatusBadge status={o.status} />,
  }));

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }} dir={dir}>
        <div style={{ flex: '1 1 320px', minWidth: 240 }}>
          <SearchField dir={dir} label={t('px.hist.search')} placeholder={t('px.hist.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Chips
          dir={dir}
          label={t('nav.orderHistory')}
          value={filter}
          onChange={setFilter}
          items={['all', 'inPrepress', 'ready', 'completed'].map((k) => ({ key: k, label: t(`px.hist.filter.${k}`) }))}
        />
      </div>

      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && <Skeleton height={300} />}

      {data && data.orders.length === 0 && <EmptyState dir={dir} title={t('px.hist.empty')} />}

      {data && data.orders.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.orderHistory')}
            columns={[
              { key: 'o', label: t('px.hist.col.order') },
              { key: 't', label: t('px.hist.col.title') },
              { key: 'c', label: t('px.hist.col.client') },
              { key: 'd', label: t('px.hist.col.date') },
              { key: 's', label: t('px.hist.col.status') },
            ]}
            rows={rows}
          />
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <Pager
          dir={dir}
          page={page}
          pages={data.pages}
          onPage={setPage}
          summary={t('px.showing', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, data.total), total: data.total })}
        />
      )}
    </>
  );
};

export default PrepressOrderHistory;
