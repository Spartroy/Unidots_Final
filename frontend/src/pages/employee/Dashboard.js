import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { KpiTile, DataTable, Notice, EmptyState } from '../../design/kit';
import { Skeleton, CountUp } from '../../design/motionKit';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';

const CLOSED = ['Completed', 'Delivered', 'Cancelled'];

// Designer home: what is assigned, what needs action now, nearest deadline first.
const EmployeeDashboard = () => {
  const { t, lang, dir } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/orders?limit=100&status[ne]=Cancelled');
      setOrders(res.data.orders || []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('emp.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const s = useMemo(() => {
    const list = orders || [];
    const open = list.filter((o) => !CLOSED.includes(o.status));
    const now = Date.now();
    const action = open.filter((o) => ['Designing', 'Design Done'].includes(o.status)).sort((a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity));
    return {
      assigned: open.length,
      designing: open.filter((o) => o.status === 'Designing').length,
      ripping: open.filter((o) => o.status === 'Design Done').length,
      prepress: open.filter((o) => ['In Prepress', 'Ready for Delivery', 'Delivering'].includes(o.status)).length,
      overdue: open.filter((o) => o.deadline && new Date(o.deadline).getTime() < now).length,
      action,
    };
  }, [orders]);

  usePageChrome({ subtitle: orders ? t('emp.subtitle', { overdue: s.overdue, ripping: s.ripping }) : undefined });

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (error && !orders) {
    return (
      <Notice tone="error">
        {error}{' '}
        <button type="button" className="ud-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={load}>{t('common.retry')}</button>
      </Notice>
    );
  }
  if (!orders) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ud-grid ud-grid-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} />)}</div>
        <Skeleton height={240} />
      </div>
    );
  }

  const tiles = [
    { key: 'assigned', icon: 'orders', value: s.assigned, to: '/employee/orders' },
    { key: 'designing', icon: 'production', value: s.designing, to: '/employee/orders?status=Designing' },
    { key: 'ripping', icon: 'tasks', value: s.ripping, to: '/employee/orders?status=Design Done' },
    { key: 'prepress', icon: 'production', value: s.prepress, to: '/employee/orders?status=In Prepress' },
    { key: 'overdue', icon: 'claims', value: s.overdue, to: '/employee/orders', attention: s.overdue > 0 },
  ];

  return (
    <>
      <div className="ud-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {tiles.map((k, i) => (
          <div key={k.key} className="ud-rise" style={{ '--i': i }}>
            <KpiTile
              icon={k.icon}
              tone={k.attention ? 'attention' : undefined}
              label={t(`emp.kpi.${k.key}`)}
              value={<CountUp value={k.value} />}
              action={<Link className="ud-link" style={{ fontSize: 14, marginBlockStart: 4 }} to={k.to}>{t('emp.kpi.view')}</Link>}
            />
          </div>
        ))}
      </div>

      <section className="ud-card ud-pad0 ud-rise" style={{ '--i': 6 }} aria-labelledby="action-title">
        <div className="ud-card-head">
          <div>
            <h2 id="action-title" className="ud-card-h">{t('emp.action.title')}</h2>
            <p className="ud-card-s" style={{ margin: 0 }}>{t('emp.action.sub')}</p>
          </div>
        </div>
        {s.action.length === 0 ? (
          <div style={{ padding: 16 }}><EmptyState dir={dir} title={t('emp.action.empty')} /></div>
        ) : (
          <DataTable
            dir={dir}
            caption={t('emp.action.title')}
            columns={[
              { key: 'o', label: t('ol.col.order') },
              { key: 't', label: t('ol.col.title') },
              { key: 'd', label: t('ol.col.deadline') },
              { key: 's', label: t('ol.col.status') },
            ]}
            rows={s.action.slice(0, 8).map((o) => ({
              o: <Link className="ud-link" to={`/employee/orders/${o._id}`}>{o.orderNumber}</Link>,
              t: o.title,
              d: o.deadline ? <span style={o.deadline && new Date(o.deadline) < new Date() ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{fmt(o.deadline)}</span> : t('ol.noDeadline'),
              s: <OrderStatusBadge status={o.status} />,
            }))}
          />
        )}
      </section>
    </>
  );
};

export default EmployeeDashboard;
