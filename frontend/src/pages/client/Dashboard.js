import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { KpiTile, OrderStepper, DataTable, Notice, EmptyState } from '../../design/kit';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { stepperIndex } from '../../utils/orderStatus';

// Client home: where the latest order is, the totals, and recent orders.
const ClientDashboard = () => {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.get('/api/orders/client-stats'), api.get('/api/orders/recent')]);
      setStats(s.data);
      setRecent(Array.isArray(r.data) ? r.data : []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('dash.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const waiting = stats ? stats.submittedOrders : 0;
  const inPrepress = stats ? stats.inPrepressOrders : 0;
  const subtitle = stats ? t('dash.subtitle', { prepress: inPrepress, waiting }) : undefined;
  const actions = useMemo(
    () => (
      <Link to="/client/orders/new" className="ud-btn ud-btn-primary">
        {t('dash.newOrder')}
      </Link>
    ),
    [t]
  );
  usePageChrome({ subtitle, actions });

  if (error && !stats) {
    return (
      <Notice tone="error" title={t('dash.loadErrorTitle')}>
        {error}{' '}
        <button type="button" className="ud-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={load}>
          {t('common.retry')}
        </button>
      </Notice>
    );
  }
  if (!stats) {
    return (
      <p role="status" className="ud-hint">
        {t('common.loading')}
      </p>
    );
  }

  const latest = recent[0];
  const kpis = [
    { key: 'total', icon: 'orders', label: t('dash.kpi.total'), value: stats.totalOrders, to: '/client/orders', action: t('dash.viewAll') },
    { key: 'sub', icon: 'orders', label: t('dash.kpi.submitted'), value: stats.submittedOrders, to: '/client/orders?status=Submitted', action: t('dash.view') },
    { key: 'des', icon: 'production', label: t('dash.kpi.designing'), value: stats.inDesignOrders, to: '/client/orders?status=Designing', action: t('dash.view') },
    { key: 'pre', icon: 'production', label: t('dash.kpi.inPrepress'), value: stats.inPrepressOrders, to: '/client/orders?status=In Prepress', action: t('dash.view') },
    { key: 'done', icon: 'tasks', label: t('dash.kpi.completed'), value: stats.completedOrders, to: '/client/orders?status=Completed', action: t('dash.view') },
    { key: 'claims', icon: 'claims', label: t('dash.kpi.claims'), value: stats.totalClaims, to: '/client/claims', action: t('dash.view') },
  ];

  const rows = recent.map((o) => ({
    o: <Link className="ud-link" to={`/client/orders/${o._id}`}>{o.orderNumber}</Link>,
    t: o.title,
    d: fmt(o.createdAt),
    s: <OrderStatusBadge status={o.status} />,
  }));

  return (
    <>
      {latest ? (
        <section className="ud-card ud-feature" aria-labelledby="latest-title">
          <div className="ud-feature-top">
            <div>
              <span className="ud-hint">{t('dash.latest')}</span>
              <h2 id="latest-title" className="ud-card-h" style={{ margin: 0 }}>
                {latest.title} ({latest.orderNumber})
              </h2>
            </div>
            <OrderStatusBadge status={latest.status} />
          </div>
          <OrderStepper
            current={stepperIndex(latest.status)}
            steps={[t('step.submission'), t('step.design'), t('step.ripping'), t('step.prepress'), t('step.delivery')]}
            label={t('dash.progress')}
          />
          <p className="ud-card-s" style={{ margin: 0 }}>{t(`status.next.${latest.status}`, { date: fmt(latest.createdAt) })}</p>
        </section>
      ) : (
        <EmptyState
          title={t('dash.emptyTitle')}
          action={<Link to="/client/orders/new" className="ud-btn ud-btn-primary">{t('dash.newOrder')}</Link>}
        >
          {t('dash.emptyText')}
        </EmptyState>
      )}

      <div className="ud-grid ud-grid-6">
        {kpis.map((k) => (
          <KpiTile key={k.key} icon={k.icon} label={k.label} value={k.value} action={<Link className="ud-link" style={{ fontSize: 14, marginBlockStart: 4 }} to={k.to}>{k.action}</Link>} />
        ))}
      </div>

      {recent.length > 0 && (
        <section className="ud-card ud-pad0" aria-labelledby="recent-title">
          <div className="ud-card-head">
            <div>
              <h2 id="recent-title" className="ud-card-h">{t('dash.recent')}</h2>
              <p className="ud-card-s" style={{ margin: 0 }}>{t('dash.recentSub', { n: recent.length })}</p>
            </div>
            <Link to="/client/orders" className="ud-btn ud-btn-secondary">{t('dash.viewAllOrders')}</Link>
          </div>
          <DataTable
            caption={t('dash.recent')}
            columns={[
              { key: 'o', label: t('dash.col.order') },
              { key: 't', label: t('dash.col.title') },
              { key: 'd', label: t('dash.col.ordered') },
              { key: 's', label: t('dash.col.status') },
            ]}
            rows={rows}
          />
        </section>
      )}
    </>
  );
};

export default ClientDashboard;
