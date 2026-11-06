import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, DataTable, EmptyState, KpiTile, Notice, TankGauge } from '../../design/kit';
import { Field } from '../../design/controls';
import { CountUp, Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';

const LOW_PERCENT = 30;
const SHOWN = 8;

// Prepress: solvent tank, refills and recent usage. Shows only real records.
const AcidSolutionMonitor = () => {
  const { t, lang, dir } = useLanguage();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [all, setAll] = useState(false);
  const [refill, setRefill] = useState(false);
  const [manual, setManual] = useState(false);
  const [count, setCount] = useState('1');
  const [m, setM] = useState({ length: '', width: '', lengthRepeat: '1', widthRepeat: '1' });
  const [busy, setBusy] = useState(false);

  const actions = useMemo(() => (
    <>
      <Button variant="secondary" onClick={() => setManual(true)}>{t('as.manual')}</Button>
      <Button onClick={() => setRefill(true)}>{t('br.refill')}</Button>
    </>
  ), [t]);
  usePageChrome({ subtitle: t('as.subtitle'), actions });

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/acid-solution/status');
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('br.loadError'));
    }
    try {
      const h = await api.get('/api/acid-solution/history');
      setHistory([...(h.data.usageHistory || [])].sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt)));
    } catch (e) {
      setHistory([]);
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

  const area = (Number(m.length) * (parseInt(m.lengthRepeat, 10) || 1) * Number(m.width) * (parseInt(m.widthRepeat, 10) || 1)) / 10000;
  const litersPer = data?.litersPerM2 || 10;
  const doManual = async (e) => {
    e.preventDefault();
    if (!(area > 0)) return toast.error(t('as.manual.err'));
    try {
      setBusy(true);
      await api.post('/api/acid-solution/usage', { orderId: null, areaProcessed: area });
      toast.success(t('as.manual.done'));
      setManual(false);
      setM({ length: '', width: '', lengthRepeat: '1', widthRepeat: '1' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('as.manual.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>;
  if (!data) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;

  const mt = data.metrics || {};
  const pct = Math.round(mt.fillPercentage || 0);
  const num = (v, d = 1) => Number(v || 0).toLocaleString(locale, { maximumFractionDigits: d });
  const rows = (all ? history : history.slice(0, SHOWN)).map((u) => ({
    o: u.orderId?.orderNumber ? `${u.orderId.orderNumber}${u.orderId.title ? ` · ${u.orderId.title}` : ''}` : t('as.manual.entry'),
    a: <bdi dir="ltr">{num(u.areaProcessed, 2)} m²</bdi>,
    l: <bdi dir="ltr">{num(u.litersUsed, 1)} L</bdi>,
    c: <bdi dir="ltr">{num(u.cost, 0)}</bdi>,
    d: new Date(u.processedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
  }));

  return (
    <>
      <section className="ud-card ud-rise" dir={dir}>
        <TankGauge dir={dir} percent={pct} lowAt={LOW_PERCENT} title={t('br.tank')} liters={`${num(data.currentLiters)} L`} capacity={t('br.capacity', { max: num(mt.maxCapacity) })} statusLabel={t(pct < LOW_PERCENT ? 'br.low' : 'br.ok')} />
      </section>

      <div className="ud-grid ud-grid-6">
        {[['barrels', 'orders', data.totalBarrels], ['days', 'tasks', Math.round(mt.estimatedDaysRemaining || 0)]].map(([k, icon, v], i) => (
          <div key={k} className="ud-rise" style={{ '--i': i + 1 }}>
            <KpiTile dir={dir} icon={icon} label={t(`br.kpi.${k}`)} value={<CountUp value={Number(v) || 0} />} />
          </div>
        ))}
      </div>

      <section style={{ display: 'grid', gap: 12 }} dir={dir}>
        <h2 className="ud-card-h">{t('as.history')}</h2>
        {history.length === 0 ? (
          <EmptyState dir={dir} title={t('as.historyEmpty')} />
        ) : (
          <>
            <div className="ud-card ud-pad0 ud-rise">
              <DataTable
                dir={dir}
                caption={t('as.history')}
                columns={[{ key: 'o', label: t('as.col.order') }, { key: 'a', label: t('as.col.area') }, { key: 'l', label: t('as.col.liters') }, { key: 'c', label: t('as.col.cost') }, { key: 'd', label: t('as.col.date') }]}
                rows={rows}
              />
            </div>
            {history.length > SHOWN && <div><Button variant="secondary" onClick={() => setAll((v) => !v)}>{all ? t('as.showLess') : t('as.showAll', { n: history.length })}</Button></div>}
          </>
        )}
      </section>

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

      {manual && (
        <Modal
          title={t('as.manual.title')}
          onClose={() => setManual(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setManual(false)}>{t('br.cancel')}</Button>
              <Button type="submit" form="manual" disabled={busy}>{t('as.manual.save')}</Button>
            </>
          }
        >
          <p>{t('as.manual.text')}</p>
          <form id="manual" onSubmit={doManual} noValidate style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <Field label={t('as.manual.length')} type="number" dir="ltr" min="0" step="0.1" value={m.length} onChange={(e) => setM({ ...m, length: e.target.value })} required />
              <Field label={t('as.manual.width')} type="number" dir="ltr" min="0" step="0.1" value={m.width} onChange={(e) => setM({ ...m, width: e.target.value })} required />
              <Field label={t('as.manual.lengthRepeat')} type="number" dir="ltr" min="1" step="1" value={m.lengthRepeat} onChange={(e) => setM({ ...m, lengthRepeat: e.target.value })} />
              <Field label={t('as.manual.widthRepeat')} type="number" dir="ltr" min="1" step="1" value={m.widthRepeat} onChange={(e) => setM({ ...m, widthRepeat: e.target.value })} />
            </div>
            {area > 0 && <p className="ud-hint" style={{ margin: 0 }} aria-live="polite">{t('as.manual.preview', { m2: num(area, 3), liters: num(area * litersPer, 2) })}</p>}
          </form>
        </Modal>
      )}
    </>
  );
};

export default AcidSolutionMonitor;
