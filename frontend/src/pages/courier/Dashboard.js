import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { Chips } from '../../design/controls';
import { Notice, EmptyState } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';

const modeOf = (o) => o.stages?.delivery?.courierInfo?.mode;
const modeKey = { direct: 'cr.mode.direct', 'client-collection': 'cr.mode.clientCollection', 'shipping-company': 'cr.mode.shipping' };

// Courier home: three lists (handover, shipping company, delivered) and one big button per delivery.
const CourierDashboard = () => {
  const { t, lang, dir } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('handover');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/orders?hasDeliveryMethod=true&limit=100');
      setOrders(res.data.orders || []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('cr.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const groups = useMemo(() => {
    const list = orders || [];
    return {
      handover: list.filter((o) => ['direct', 'client-collection'].includes(modeOf(o)) && o.status !== 'Completed'),
      shipping: list.filter((o) => modeOf(o) === 'shipping-company' && o.status !== 'Completed'),
      delivered: list.filter((o) => o.status === 'Completed'),
    };
  }, [orders]);

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
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={44} width={320} />
        {[0, 1, 2].map((i) => <Skeleton key={i} height={96} />)}
      </div>
    );
  }

  const list = groups[tab];

  return (
    <>
      <Chips
        dir={dir}
        label={t('cr.title')}
        value={tab}
        onChange={setTab}
        items={['handover', 'shipping', 'delivered'].map((k) => ({ key: k, label: t(`cr.tab.${k}`), count: groups[k].length }))}
      />
      {list.length === 0 ? (
        <EmptyState dir={dir} title={t(`cr.empty.${tab}`)} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((o, i) => (
            <li key={o._id} className="ud-card ud-root ud-rise" dir={dir} style={{ '--i': Math.min(i, 8), display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                <div className="ud-order-no">{o.orderNumber} · {o.title}</div>
                <div style={{ color: 'var(--text-muted)' }}>{t('cr.client')}: {o.client?.name || '—'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {t(modeKey[modeOf(o)] || 'cr.mode.direct')}
                  {modeOf(o) === 'shipping-company' ? ` (${o.stages?.delivery?.courierInfo?.shipmentCompany || t('cr.defaultCompany')})` : ''}
                  {tab === 'delivered' ? ` · ${t('cr.deliveredOn', { date: fmt(o.stages?.delivery?.completionDate || o.updatedAt) })}` : ''}
                </div>
              </div>
              <Link to={`/courier/orders/${o._id}`} className="ud-btn ud-btn-primary ud-btn-lg" style={{ minHeight: 'var(--tap-courier)', minWidth: 140 }}>
                {t('cr.open')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default CourierDashboard;
