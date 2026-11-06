import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { KpiTile, StatusBars, TrendChart, DataTable, Notice, EmptyState } from '../../design/kit';
import { Skeleton, CountUp } from '../../design/motionKit';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import AttentionPanel from '../../components/manager/AttentionPanel';
import { statusKey } from '../../utils/orderStatus';

// Order of the pipeline, as drawn in the design (each key matches a status badge).
const PIPELINE = ['Submitted', 'Awaiting Approval', 'Designing', 'Design Done', 'In Prepress', 'Ready for Delivery', 'Delivering', 'Completed', 'On Hold', 'Cancelled'];

// Manager home: what is late or unassigned first, then where every order is, then the month-by-month trend.
const ManagerDashboard = () => {
  const { t, lang, dir } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/overview');
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('mg.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const monthLabel = (y, m) => new Date(y, m, 1).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });

  if (error && !data) {
    return (
      <Notice tone="error">
        {error}{' '}
        <button type="button" className="ud-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={load}>{t('common.retry')}</button>
      </Notice>
    );
  }
  if (!data) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ud-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} />)}</div>
        <div className="ud-grid ud-grid-2"><Skeleton height={340} /><Skeleton height={340} /></div>
      </div>
    );
  }

  const tiles = [
    { k: 'overdue', value: data.overdue.count, note: data.overdue.count ? t('mg.kpi.overdueNote', { days: data.overdue.oldestDays }) : t('mg.kpi.overdueNone'), attention: data.overdue.count > 0, to: '/manager/orders?needsAction=true' },
    { k: 'dueToday', value: data.dueToday.count, note: t('mg.kpi.dueTodayNote', { n: data.dueToday.inPrepress }) },
    { k: 'unassigned', value: data.unassigned, note: t('mg.kpi.unassignedNote'), attention: data.unassigned > 0, to: '/manager/orders?needsAction=true' },
    { k: 'inPrepress', value: data.inPrepress, note: t('mg.kpi.inPrepressNote', { n: data.onHold }), to: '/manager/orders?status=In Prepress' },
    { k: 'open', value: data.open, note: t('mg.kpi.openNote', { total: data.total }), to: '/manager/orders' },
  ];

  const bars = PIPELINE.map((s) => ({ status: statusKey(s), count: data.byStatus[s] || 0, label: t(`status.label.${statusKey(s)}`) }));
  const points = data.perMonth.map((m) => ({ label: monthLabel(m.year, m.month), value: m.value }));

  const rows = data.overdue.items.map((o) => ({
    o: <Link className="ud-link" to={`/manager/orders/${o._id}`}>{o.orderNumber}</Link>,
    c: o.client || '—',
    d: (
      <span>
        {fmt(o.deadline)}
        <span style={{ display: 'block', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>{t('mg.daysLate', { n: o.daysLate })}</span>
      </span>
    ),
    s: <OrderStatusBadge status={o.status} />,
    a: o.assignedTo || <span style={{ color: 'var(--text-muted)' }}>{t('mg.notAssigned')}</span>,
  }));

  return (
    <>
      <div className="ud-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {tiles.map((x, i) => (
          <div key={x.k} className="ud-rise" style={{ '--i': i }}>
            <KpiTile
              label={t(`mg.kpi.${x.k}`)}
              tone={x.attention ? 'attention' : undefined}
              value={<CountUp value={x.value} />}
              note={x.note}
              action={x.to ? <Link className="ud-link" style={{ fontSize: 14, marginBlockStart: 4 }} to={x.to}>{t('dash.view')}</Link> : undefined}
            />
          </div>
        ))}
      </div>

      <div className="ud-grid ud-grid-2" dir={dir}>
        <section className="ud-card ud-rise" style={{ '--i': 5 }}>
          <h2 className="ud-card-h">{t('mg.byStatus')}</h2>
          <p className="ud-card-s">{t('mg.byStatusSub', { n: data.total })}</p>
          <StatusBars dir={dir} label={t('mg.byStatus')} items={bars} />
        </section>
        <section className="ud-card ud-rise" style={{ '--i': 6 }}>
          <h2 className="ud-card-h">{t('mg.perMonth')}</h2>
          <p className="ud-card-s">{t('mg.perMonthSub')}</p>
          <TrendChart label={t('mg.perMonth')} points={points} emptyText={t('mg.noOrdersPeriod')} />
        </section>
      </div>

      <section className="ud-card ud-pad0 ud-rise" style={{ '--i': 7 }} aria-labelledby="attn-title">
        <div className="ud-card-head">
          <div>
            <h2 id="attn-title" className="ud-card-h">{t('mg.attention')}</h2>
            <p className="ud-card-s" style={{ margin: 0 }}>{t('mg.attentionSub')}</p>
          </div>
          {data.overdue.count > 0 && <Link to="/manager/orders?needsAction=true" className="ud-btn ud-btn-secondary">{t('mg.viewAll', { n: data.overdue.count })}</Link>}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 16 }}><EmptyState dir={dir} title={t('mg.attentionEmpty')} /></div>
        ) : (
          <DataTable
            dir={dir}
            caption={t('mg.attention')}
            columns={[
              { key: 'o', label: t('ol.col.order') },
              { key: 'c', label: t('ol.col.client') },
              { key: 'd', label: t('mg.col.due') },
              { key: 's', label: t('ol.col.status') },
              { key: 'a', label: t('mg.col.assigned') },
            ]}
            rows={rows}
          />
        )}
      </section>

      <AttentionPanel />
    </>
  );
};

export default ManagerDashboard;
