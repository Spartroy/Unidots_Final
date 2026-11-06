import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips, Pager, SearchField, Select } from '../../design/controls';
import { DataTable, Notice, EmptyState, Button } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';

const PAGE_SIZE = 10;
const FILTERS = {
  all: {},
  needsAction: { needsAction: 'true' },
  designing: { status: 'Designing' },
  inPrepress: { status: 'In Prepress' },
  ready: { status: 'Ready for Delivery' },
  completed: { status: 'Completed' },
};
const FROM_STATUS = { 'In Prepress': 'inPrepress', Designing: 'designing', 'Ready for Delivery': 'ready', Completed: 'completed' };
const CLOSED = ['Completed', 'Delivered', 'Cancelled'];

// Manager: every order, filterable, with assignment right from the list.
const ManagerOrders = () => {
  const { t, lang, dir } = useLanguage();
  const [params] = useSearchParams();
  const initial = params.get('needsAction') === 'true' ? 'needsAction' : FROM_STATUS[params.get('status')] || 'all';
  const [filter, setFilter] = useState(initial);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [designer, setDesigner] = useState('');
  const [sort, setSort] = useState('created');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [needs, setNeeds] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(null); // the order being assigned
  const [chosen, setChosen] = useState('');
  const [saving, setSaving] = useState(false);

  usePageChrome({ subtitle: t('mg.subtitle.orders') });

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [filter, designer, sort]);

  useEffect(() => {
    api.get('/api/orders/overview').then((r) => setOverview(r.data)).catch(() => {});
    api.get('/api/orders?needsAction=true&limit=1').then((r) => setNeeds(r.data.total)).catch(() => {});
    api.get('/api/users?role=employee&isActive=true&limit=100').then((r) => setEmployees(r.data.users || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort, ...FILTERS[filter] });
      if (query) p.set('search', query);
      if (designer) p.set('assignedTo', designer);
      const res = await api.get(`/api/orders?${p.toString()}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('ol.loadError'));
    }
  }, [page, filter, query, designer, sort, t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const daysLate = (o) => (o.deadline && !CLOSED.includes(o.status) && new Date(o.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) ? Math.max(1, Math.round((Date.now() - new Date(o.deadline)) / 86400000)) : 0);

  const counts = overview ? { all: overview.total, needsAction: needs ?? undefined, designing: overview.byStatus.Designing, inPrepress: overview.byStatus['In Prepress'], ready: overview.byStatus['Ready for Delivery'], completed: overview.byStatus.Completed } : {};

  const assign = async () => {
    try {
      setSaving(true);
      await api.put(`/api/orders/${assigning._id}/assign`, { employeeId: chosen });
      toast.success(t('mg.assigned'));
      setAssigning(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('mg.assignError'));
    } finally {
      setSaving(false);
    }
  };

  const orders = data?.orders || [];
  const rows = orders.map((o) => {
    const late = daysLate(o);
    return {
      o: <Link className="ud-link" to={`/manager/orders/${o._id}`}>{o.orderNumber}</Link>,
      t: o.title,
      c: o.client?.name || '—',
      d: o.deadline ? (
        <span>
          {fmt(o.deadline)}
          {late > 0 && <span style={{ display: 'block', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>{t('mg.daysLate', { n: late })}</span>}
        </span>
      ) : t('ol.noDeadline'),
      s: <OrderStatusBadge status={o.status} />,
      a: o.assignedTo?.name ? (
        o.assignedTo.name
      ) : CLOSED.includes(o.status) ? (
        <span style={{ color: 'var(--text-muted)' }}>{t('mg.notAssigned')}</span>
      ) : (
        <button type="button" className="ud-btn ud-btn-secondary" onClick={() => { setAssigning(o); setChosen(''); }}>{t('mg.assign')}</button>
      ),
    };
  });

  return (
    <>
      <Chips dir={dir} label={t('nav.orders')} value={filter} onChange={setFilter} items={Object.keys(FILTERS).map((k) => ({ key: k, label: k === 'needsAction' ? t('mg.filter.needsAction') : k === 'ready' ? t('mg.filter.ready') : t(`ol.filter.${k}`), count: counts[k] }))} />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }} dir={dir}>
        <div style={{ flex: '1 1 300px', minWidth: 240 }}>
          <SearchField dir={dir} label={t('ol.search')} placeholder={t('ol.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select label={t('mg.designer')} value={designer} onChange={(e) => setDesigner(e.target.value)} options={[{ value: '', label: t('mg.allDesigners') }, ...employees.map((u) => ({ value: u._id, label: u.name }))]} />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select label={t('mg.sortBy')} value={sort} onChange={(e) => setSort(e.target.value)} options={['created', 'deadline', 'status'].map((k) => ({ value: k, label: t(`mg.sort.${k}`) }))} />
        </div>
      </div>

      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={380} /></div>}
      {data && orders.length === 0 && <EmptyState dir={dir} title={t('ol.empty')}>{t('ol.emptyStaff')}</EmptyState>}
      {data && orders.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.orders')}
            columns={[
              { key: 'o', label: t('ol.col.order') },
              { key: 't', label: t('ol.col.title') },
              { key: 'c', label: t('ol.col.client') },
              { key: 'd', label: t('mg.col.due') },
              { key: 's', label: t('ol.col.status') },
              { key: 'a', label: t('mg.col.assigned') },
            ]}
            rows={rows}
          />
        </div>
      )}
      {data && data.total > PAGE_SIZE && (
        <Pager dir={dir} page={page} pages={data.pages} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, data.total), total: data.total })} />
      )}

      {assigning && (
        <Modal
          title={t('mg.assignTitle')}
          onClose={() => setAssigning(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setAssigning(null)}>{t('mg.cancel')}</Button>
              <Button onClick={assign} disabled={!chosen || saving}>{t('mg.assignConfirm')}</Button>
            </>
          }
        >
          <p>{t('mg.assignText', { order: assigning.orderNumber })}</p>
          <Select label={t('mg.designer')} value={chosen} onChange={(e) => setChosen(e.target.value)} options={[{ value: '', label: '—' }, ...employees.map((u) => ({ value: u._id, label: u.name }))]} />
        </Modal>
      )}
    </>
  );
};

export default ManagerOrders;
