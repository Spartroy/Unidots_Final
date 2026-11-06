import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, KpiTile, Notice, TankGauge } from '../../design/kit';
import { Field } from '../../design/controls';
import { CountUp, Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';

const LOW_PERCENT = 30;

// Manager: solvent tank level, barrels, and the cost settings behind reports and quotes.
const BarrelManagement = () => {
  const { t, lang, dir } = useLanguage();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refill, setRefill] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [count, setCount] = useState('1');
  const [settings, setSettings] = useState({});
  const [busy, setBusy] = useState(false);

  const actions = useMemo(
    () => (
      <>
        <Button variant="secondary" onClick={() => setSettingsOpen(true)}>{t('br.settings')}</Button>
        <Button onClick={() => setRefill(true)}>{t('br.refill')}</Button>
      </>
    ),
    [t]
  );
  usePageChrome({ subtitle: t('br.subtitle'), actions });

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/acid-solution/status');
      setData(r.data);
      setSettings({
        costPerBarrel: r.data.costPerBarrel, recyclingCostPerBarrel: r.data.recyclingCostPerBarrel,
        costPerSquareMeter: r.data.costPerSquareMeter, litersPerM2: r.data.litersPerM2, recyclingRate: r.data.recyclingRate,
      });
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('br.loadError'));
    }
  }, [t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 30000, [load]);

  const doRefill = async (e) => {
    e.preventDefault();
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) return toast.error(t('br.refill.err'));
    try {
      setBusy(true);
      const r = await api.post('/api/acid-solution/refill', { barrelCount: n });
      toast.success(t('br.refill.done', { n, liters: Math.round(r.data.currentLiters) }));
      setRefill(false);
      setCount('1');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('br.refill.failed'));
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    const vals = Object.values(settings).map(Number);
    if (vals.some((v) => !Number.isFinite(v) || v < 0) || Number(settings.recyclingRate) > 1) return toast.error(t('br.set.err'));
    try {
      setBusy(true);
      await api.put('/api/acid-solution/settings', Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, Number(v)])));
      toast.success(t('br.set.saved'));
      setSettingsOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('br.set.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>;
  if (!data) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;

  const m = data.metrics || {};
  const stats = data.monthlyStats || {};
  const pct = Math.round(m.fillPercentage || 0);
  const num = (v) => Number(v || 0).toLocaleString(locale, { maximumFractionDigits: 1 });
  const setField = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }));
  const kpis = [
    ['barrels', 'orders', data.totalBarrels, null],
    ['days', 'tasks', Math.round(m.estimatedDaysRemaining || 0), null],
    ['recycling', 'reports', Math.round((data.recyclingRate || 0) * 100), '%'],
    ['orders', 'orders', stats.ordersProcessed || 0, null],
    ['area', 'reports', Math.round(stats.totalAreaProcessed || 0), 'm²'],
    ['used', 'claims', Math.round(stats.litersUsed || 0), 'L'],
  ];

  return (
    <>
      <section className="ud-card ud-rise" dir={dir}>
        <TankGauge dir={dir} percent={pct} lowAt={LOW_PERCENT} title={t('br.tank')} liters={`${num(data.currentLiters)} L`} capacity={t('br.capacity', { max: num(m.maxCapacity) })} statusLabel={t(pct < LOW_PERCENT ? 'br.low' : 'br.ok')} />
      </section>

      <div className="ud-grid ud-grid-6">
        {kpis.map(([k, icon, v, unit], i) => (
          <div key={k} className="ud-rise" style={{ '--i': i + 1 }}>
            <KpiTile dir={dir} icon={icon} label={t(`br.kpi.${k}`)} value={<><CountUp value={Number(v) || 0} />{unit ? <span style={{ fontSize: 16 }}> {unit}</span> : null}</>} />
          </div>
        ))}
      </div>

      {refill && (
        <Modal
          title={t('br.refill.title')}
          onClose={() => setRefill(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setRefill(false)}>{t('br.cancel')}</Button>
              <Button type="submit" form="refill" disabled={busy}>{t('br.refill.confirm')}</Button>
            </>
          }
        >
          <p>{t('br.refill.text', { liters: Math.round(data.currentLiters) })}</p>
          <form id="refill" onSubmit={doRefill} noValidate>
            <Field label={t('br.refill.count')} type="number" dir="ltr" min="1" step="1" value={count} onChange={(e) => setCount(e.target.value)} required />
          </form>
        </Modal>
      )}

      {settingsOpen && (
        <Modal
          title={t('br.set.title')}
          onClose={() => setSettingsOpen(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setSettingsOpen(false)}>{t('br.cancel')}</Button>
              <Button type="submit" form="settings" disabled={busy}>{t('br.set.save')}</Button>
            </>
          }
        >
          <form id="settings" onSubmit={saveSettings} noValidate style={{ display: 'grid', gap: 12 }}>
            <Field label={t('br.set.costPerBarrel')} type="number" dir="ltr" min="0" step="0.01" value={settings.costPerBarrel ?? ''} onChange={setField('costPerBarrel')} />
            <Field label={t('br.set.recycling')} type="number" dir="ltr" min="0" step="0.01" value={settings.recyclingCostPerBarrel ?? ''} onChange={setField('recyclingCostPerBarrel')} />
            <Field label={t('br.set.perM2')} type="number" dir="ltr" min="0" step="0.01" value={settings.costPerSquareMeter ?? ''} onChange={setField('costPerSquareMeter')} />
            <Field label={t('br.set.litersPerM2')} type="number" dir="ltr" min="0" step="0.1" value={settings.litersPerM2 ?? ''} onChange={setField('litersPerM2')} />
            <Field label={t('br.set.rate')} type="number" dir="ltr" min="0" max="1" step="0.01" value={settings.recyclingRate ?? ''} onChange={setField('recyclingRate')} />
          </form>
        </Modal>
      )}
    </>
  );
};

export default BarrelManagement;
