import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, EmptyState, Notice, StatusBadge } from '../../design/kit';
import { Field, Select } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';

const MATERIALS = ['Flint', 'Strong', 'Taiwan', 'Other'];
const THICKNESSES = ['1.14', '1.7', '2.54'];

const Level = ({ low }) => {
  const { t } = useLanguage();
  return <StatusBadge status={low ? 'cancelled' : 'completed'} label={t(low ? 'inventory.low' : 'inventory.ok')} />;
};

const Mini = ({ id, label, onSubmit, button, ...props }) => (
  <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
    <div style={{ flex: 1, minWidth: 0 }}><Field id={id} label={label} type="number" dir="ltr" required {...props} /></div>
    <Button type="submit" variant="secondary" style={{ flex: 'none' }}>{button}</Button>
  </form>
);

const ItemCard = ({ item, onChanged, i }) => {
  const { t, lang, dir } = useLanguage();
  const [receive, setReceive] = useState('');
  const [count, setCount] = useState('');
  const [threshold, setThreshold] = useState(String(item.lowStockThreshold));
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, ok) => {
    try {
      setBusy(true);
      await fn();
      if (ok) toast.success(ok);
      onChanged();
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || t('inventory.error'));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const loadHistory = async () => {
    try {
      const r = await api.get(`/api/inventory/${item._id}/movements`);
      setHistory(r.data);
    } catch (e) {
      toast.error(t('inventory.error'));
    }
  };

  return (
    <li className="ud-card ud-rise" style={{ '--i': i, display: 'flex', flexDirection: 'column', gap: 16 }} dir={dir}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h3 className="ud-card-h">{item.material} · <bdi dir="ltr">{item.thickness} mm</bdi></h3>
          <p className="ud-card-s">{t('inventory.onHand')}: <b><bdi dir="ltr">{item.quantity} m²</bdi></b></p>
        </div>
        <Level low={item.low} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <Mini id={`rec-${item._id}`} label={`${t('inventory.receive')} (m²)`} min="0" step="0.01" value={receive} onChange={(e) => setReceive(e.target.value)} button="+" aria-label={t('inventory.receive')}
          onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post(`/api/inventory/${item._id}/receive`, { quantity: Number(receive) }), t('inventory.received'))) setReceive(''); }} />
        <Mini id={`cnt-${item._id}`} label={`${t('inventory.count')} (m²)`} step="0.01" value={count} onChange={(e) => setCount(e.target.value)} button={t('inventory.set')}
          onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post(`/api/inventory/${item._id}/adjust`, { quantity: Number(count) }), t('inventory.counted'))) setCount(''); }} />
        <Mini id={`thr-${item._id}`} label={`${t('inventory.alertBelow')} (m²)`} min="0" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} button={t('inventory.save')}
          onSubmit={(e) => { e.preventDefault(); run(() => api.put(`/api/inventory/${item._id}`, { lowStockThreshold: Number(threshold) }), t('inventory.thresholdSaved')); }} />
      </div>
      <details onToggle={(e) => e.target.open && !history && loadHistory()}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('inventory.history')}</summary>
        {busy && <span className="ud-sr" role="status">{t('common.loading')}</span>}
        {history && history.length === 0 && <p className="ud-card-s" style={{ marginBlockStart: 8 }}>{t('inventory.noHistory')}</p>}
        {history && history.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
            {history.map((m) => (
              <li key={m._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBlock: 6, borderBlockStart: '1px solid var(--border)' }}>
                <span>{new Date(m.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')} · {t(`inventory.reason.${m.reason}`)}{m.order?.orderNumber ? ` · ${m.order.orderNumber}` : ''}</span>
                <b dir="ltr" style={{ color: m.delta < 0 ? 'var(--danger)' : 'var(--status-completed-fg)' }}>{m.delta > 0 ? '+' : ''}{m.delta} m²</b>
              </li>
            ))}
          </ul>
        )}
      </details>
    </li>
  );
};

// Manager: plate material in stock and the solvent level.
const Inventory = () => {
  const { t, dir } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ material: 'Flint', thickness: '1.7', quantity: '', lowStockThreshold: '' });
  const [adding, setAdding] = useState(false);
  usePageChrome({ subtitle: t('inventory.help') });

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/inventory');
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('inventory.loadError'));
    }
  }, [t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const add = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      await api.post('/api/inventory', { material: form.material, thickness: Number(form.thickness), quantity: Number(form.quantity) || 0, lowStockThreshold: Number(form.lowStockThreshold) || 0 });
      toast.success(t('inventory.added'));
      setForm((f) => ({ ...f, quantity: '', lowStockThreshold: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.error'));
    } finally {
      setAdding(false);
    }
  };

  if (error && !data) return <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>;
  if (!data) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;
  const { items, solvent } = data;

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 960 }} dir={dir}>
      {solvent && (
        <section className="ud-card ud-rise" aria-labelledby="solvent-title" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 id="solvent-title" className="ud-card-h">{t('inventory.solvent')}</h2>
            <Level low={solvent.low} />
          </div>
          <p style={{ margin: 0 }}>{t('inventory.solventLevel', { liters: Math.round(solvent.currentLiters), barrels: solvent.totalBarrels })}</p>
          <Link to="/manager/barrel-management" className="ud-link">{t('inventory.manageBarrels')}</Link>
        </section>
      )}

      <section aria-labelledby="plates-title" style={{ display: 'grid', gap: 12 }}>
        <h2 id="plates-title" className="ud-card-h">{t('inventory.plates')}</h2>
        {items.length === 0 ? (
          <EmptyState dir={dir} title={t('inventory.empty')} />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {items.map((item, i) => <ItemCard key={item._id} item={item} i={i} onChanged={load} />)}
          </ul>
        )}
      </section>

      <form onSubmit={add} className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="ud-card-h">{t('inventory.addTitle')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Select label={t('inventory.material')} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} options={MATERIALS} />
          <Select label={t('inventory.thickness')} value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} options={THICKNESSES} />
          <Field label={`${t('inventory.opening')} (m²)`} type="number" dir="ltr" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Field label={`${t('inventory.alertBelow')} (m²)`} type="number" dir="ltr" min="0" step="0.01" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
        </div>
        <div><Button type="submit" disabled={adding}>{t('inventory.add')}</Button></div>
      </form>
    </div>
  );
};

export default Inventory;
