import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, EmptyState, KpiTile, Notice } from '../../design/kit';
import { Field, Select } from '../../design/controls';
import { CountUp, Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import { MATERIALS, THICKNESSES } from '../../utils/orderForm';

const TO_CM = { cm: 1, mm: 0.1, inch: 2.54 };

// The plate drawn to scale. Colours come from theme variables so it works in light and dark.
const Layout = ({ plate, placements, preview, label }) => {
  const W = plate.widthCm;
  const H = plate.heightCm;
  const grid = [];
  for (let x = 50; x < W; x += 50) grid.push(<line key={`x${x}`} x1={x} x2={x} y1={0} y2={H} stroke="var(--border)" strokeWidth={Math.max(W, H) / 600} />);
  for (let y = 50; y < H; y += 50) grid.push(<line key={`y${y}`} x1={0} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth={Math.max(W, H) / 600} />);
  const sw = Math.max(W, H) / 400;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxHeight: 460, background: 'var(--bg-card)', border: '2px solid var(--border-control)', borderRadius: 8 }}>
      {grid}
      <rect x={0} y={0} width={plate.marginLeftCm} height={H} fill="var(--border)" />
      <rect x={W - plate.marginRightCm} y={0} width={plate.marginRightCm} height={H} fill="var(--border)" />
      {placements.map((p, i) => (
        <g key={i}>
          <rect x={p.xCm} y={p.yCm} width={p.widthCm} height={p.heightCm} fill="var(--brand-500)" fillOpacity={0.65} stroke="var(--primary)" strokeWidth={sw} />
          <text x={p.xCm + p.widthCm / 2} y={p.yCm + p.heightCm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(p.widthCm, p.heightCm, W / 12)} fill="var(--on-primary)" fontWeight="700">{i + 1}</text>
        </g>
      ))}
      {preview && <rect x={preview.xCm} y={preview.yCm} width={preview.widthCm} height={preview.heightCm} fill="var(--status-submitted-bg)" fillOpacity={0.7} stroke="var(--status-submitted-fg)" strokeWidth={sw} strokeDasharray={`${sw * 4} ${sw * 3}`} />}
    </svg>
  );
};

const Swatch = ({ color, children, dashed }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
    <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 3, background: color, border: dashed ? '2px dashed var(--status-submitted-fg)' : '1px solid var(--border-control)' }} />
    {children}
  </span>
);

const NewPlate = ({ onClose, onDone }) => {
  const { t } = useLanguage();
  const [f, setF] = useState({ name: '', widthCm: '500', heightCm: '500', marginLeftCm: '2', marginRightCm: '2', material: 'Flint', materialThickness: '1.7' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(f.widthCm) > 0 && Number(f.heightCm) > 0)) return toast.error(t('pm.create.err'));
    try {
      setBusy(true);
      await api.post('/api/plates', { ...f, widthCm: Number(f.widthCm), heightCm: Number(f.heightCm), marginLeftCm: Number(f.marginLeftCm), marginRightCm: Number(f.marginRightCm), materialThickness: Number(f.materialThickness) });
      toast.success(t('pm.create.done'));
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || t('pm.create.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={t('pm.create.title')} onClose={onClose} actions={<><Button variant="secondary" onClick={onClose}>{t('pm.job.cancel')}</Button><Button type="submit" form="new-plate" disabled={busy}>{t('pm.create.submit')}</Button></>}>
      <form id="new-plate" onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <Field label={t('pm.create.name')} value={f.name} onChange={set('name')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <Field label={t('pm.create.width')} type="number" dir="ltr" min="1" value={f.widthCm} onChange={set('widthCm')} required />
          <Field label={t('pm.create.height')} type="number" dir="ltr" min="1" value={f.heightCm} onChange={set('heightCm')} required />
          <Field label={t('pm.create.marginL')} type="number" dir="ltr" min="0" value={f.marginLeftCm} onChange={set('marginLeftCm')} />
          <Field label={t('pm.create.marginR')} type="number" dir="ltr" min="0" value={f.marginRightCm} onChange={set('marginRightCm')} />
          <Select label={t('pm.create.material')} value={f.material} onChange={set('material')} options={MATERIALS} />
          <Select label={t('pm.create.thickness')} value={f.materialThickness} onChange={set('materialThickness')} options={THICKNESSES.map(String)} />
        </div>
      </form>
    </Modal>
  );
};

const AddJob = ({ plate, plateId, onClose, onDone, onPreview }) => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [sim, setSim] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/orders?status=In%20Prepress&limit=100')
      .then((r) => setOrders((r.data.orders || []).filter((o) => o.specifications?.material === plate.material && Number(o.specifications?.materialThickness) === Number(plate.materialThickness))))
      .catch(() => {});
  }, [plate]);
  useEffect(() => () => onPreview(null), [onPreview]);

  const pick = (id) => {
    setOrderId(id);
    setSim(null);
    onPreview(null);
    const d = orders.find((o) => o._id === id)?.specifications?.dimensions;
    if (!id) return;
    if (!d) return toast.warn(t('pm.job.noDims'));
    const k = TO_CM[d.unit || 'mm'] ?? 0.1;
    setW(String(Number((Number(d.width) * k * (parseInt(d.widthRepeatCount, 10) || 1)).toFixed(2))));
    setH(String(Number((Number(d.height) * k * (parseInt(d.heightRepeatCount, 10) || 1)).toFixed(2))));
  };

  const check = async () => {
    const widthCm = Number(w);
    const heightCm = Number(h);
    if (!(widthCm > 0 && heightCm > 0)) return toast.error(t('pm.job.err'));
    try {
      const r = await api.post(`/api/plates/${plateId}/simulate`, { widthCm, heightCm });
      setSim(r.data);
      onPreview(r.data.fits && r.data.position ? { ...r.data.position, widthCm, heightCm } : null);
    } catch (e) {
      toast.error(e.response?.data?.message || t('pm.job.failed'));
    }
  };
  const add = async () => {
    if (!sim?.fits) return toast.warn(t('pm.job.checkFirst'));
    try {
      setBusy(true);
      await api.post(`/api/plates/${plateId}/placements`, { widthCm: Number(w), heightCm: Number(h), orderId: orderId || undefined });
      toast.success(t('pm.job.added'));
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || t('pm.job.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('pm.job.title')} onClose={onClose} actions={<><Button variant="secondary" onClick={onClose}>{t('pm.job.cancel')}</Button><Button disabled={busy || !sim?.fits} onClick={add}>{t('pm.job.add')}</Button></>}>
      <div style={{ display: 'grid', gap: 12 }}>
        <Select label={t('pm.job.order')} hint={t('pm.job.orderHint')} value={orderId} onChange={(e) => pick(e.target.value)} options={[{ value: '', label: t('pm.job.orderNone') }, ...orders.map((o) => ({ value: o._id, label: `${o.orderNumber} — ${o.title}` }))]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <Field label={t('pm.job.width')} type="number" dir="ltr" min="0" step="0.1" value={w} onChange={(e) => { setW(e.target.value); setSim(null); onPreview(null); }} />
          <Field label={t('pm.job.height')} type="number" dir="ltr" min="0" step="0.1" value={h} onChange={(e) => { setH(e.target.value); setSim(null); onPreview(null); }} />
        </div>
        <div><Button variant="secondary" onClick={check}>{t('pm.job.check')}</Button></div>
        {sim && (
          <Notice tone={sim.fits ? 'success' : 'error'}>
            {sim.fits ? t('pm.job.fits', { x: Number(sim.position?.xCm ?? 0).toFixed(1), y: Number(sim.position?.yCm ?? 0).toFixed(1) }) : t('pm.job.noFit')}
          </Notice>
        )}
      </div>
    </Modal>
  );
};

// Prepress: place jobs on a plate, see the waste, and close the plate when it is full.
const PlateMonitoring = () => {
  const { t, lang, dir } = useLanguage();
  const [plates, setPlates] = useState(null);
  const [activeId, setActiveId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const actions = useMemo(() => (
    <>
      <Button variant="secondary" onClick={() => setModal('new')}>{t('pm.new')}</Button>
      {activeId && <Button onClick={() => setModal('job')}>{t('pm.addJob')}</Button>}
    </>
  ), [t, activeId]);
  usePageChrome({ subtitle: t('pm.subtitle'), actions });

  const loadPlates = useCallback(async (keep) => {
    try {
      const r = await api.get('/api/plates?status=Active');
      const list = Array.isArray(r.data) ? r.data : r.data.plates || [];
      setPlates(list);
      setActiveId((cur) => (keep && list.some((p) => p._id === cur) ? cur : list[0]?._id || ''));
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('pm.loadError'));
    }
  }, [t]);
  useEffect(() => {
    loadPlates(true);
  }, [loadPlates]);

  const loadPlate = useCallback(async () => {
    if (!activeId) return setData(null);
    try {
      const r = await api.get(`/api/plates/${activeId}`);
      setData(r.data);
    } catch (e) {
      setError(e.response?.data?.message || t('pm.loadError'));
    }
  }, [activeId, t]);
  useEffect(() => {
    setData(null);
    loadPlate();
  }, [loadPlate]);

  const remove = async (index) => {
    try {
      await api.delete(`/api/plates/${activeId}/placements`, { data: { index } });
      toast.success(t('pm.removed'));
      await loadPlate();
    } catch (e) {
      toast.error(e.response?.data?.message || t('pm.removeFailed'));
    }
  };
  const closePlate = async () => {
    try {
      setBusy(true);
      await api.put(`/api/plates/${activeId}/complete`);
      toast.success(t('pm.close.done'));
      setModal(null);
      await loadPlates(false);
    } catch (e) {
      toast.error(e.response?.data?.message || t('pm.close.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (error && !plates) return <Notice tone="error">{error}</Notice>;
  if (!plates) return <div role="status" aria-label={t('common.loading')}><Skeleton height={320} /></div>;

  const plate = data?.plate;
  const stats = data?.stats;
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const pct = (v) => `${Number(v || 0).toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  const usedPct = stats?.usableArea > 0 ? (stats.usedArea / stats.usableArea) * 100 : 0;
  const placements = plate?.placements || [];

  return (
    <>
      {plates.length === 0 ? (
        <EmptyState dir={dir} title={t('pm.noPlates')} action={<Button onClick={() => setModal('new')}>{t('pm.new')}</Button>}>{t('pm.noPlatesText')}</EmptyState>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }} dir={dir}>
            <div style={{ minWidth: 260 }}>
              <Select label={t('pm.plate')} value={activeId} onChange={(e) => setActiveId(e.target.value)} options={plates.map((p, i) => ({ value: p._id, label: `${p.name || `#${i + 1}`} · ${p.widthCm}×${p.heightCm} cm · ${p.material} ${p.materialThickness}` }))} />
            </div>
            <Button variant="secondary" style={{ color: 'var(--danger)' }} onClick={() => setModal('close')}>{t('pm.complete')}</Button>
          </div>

          {!plate ? (
            <Skeleton height={320} />
          ) : (
            <>
              <div className="ud-grid ud-grid-6">
                {[['used', 'orders', pct(usedPct)], ['waste', 'claims', pct(stats?.wastePct)], ['left', 'reports', `${Number((stats?.remainingArea || 0) / 10000).toLocaleString(locale, { maximumFractionDigits: 2 })} m²`], ['jobs', 'tasks', placements.length]].map(([k, icon, v], i) => (
                  <div key={k} className="ud-rise" style={{ '--i': i }}>
                    <KpiTile dir={dir} icon={icon} label={t(`pm.kpi.${k}`)} value={typeof v === 'number' ? <CountUp value={v} /> : <bdi dir="ltr">{v}</bdi>} />
                  </div>
                ))}
              </div>

              <section className="ud-card ud-rise" style={{ '--i': 4, display: 'grid', gap: 12 }}>
                <Layout plate={plate} placements={placements} preview={preview} label={t('pm.canvas', { w: plate.widthCm, h: plate.heightCm, n: placements.length })} />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Swatch color="var(--brand-500)">{t('pm.legend.job')}</Swatch>
                  <Swatch color="var(--status-submitted-bg)" dashed>{t('pm.legend.preview')}</Swatch>
                  <Swatch color="var(--border)">{t('pm.legend.margin')}</Swatch>
                </div>
              </section>

              <section className="ud-card ud-rise" style={{ '--i': 5, display: 'grid', gap: 8 }} dir={dir}>
                <h2 className="ud-card-h">{t('pm.jobs')}</h2>
                {placements.length === 0 ? (
                  <p className="ud-card-s">{t('pm.jobsEmpty')}</p>
                ) : (
                  <ul className="ud-files" style={{ margin: 0 }}>
                    {placements.map((p, i) => (
                      <li key={i} className="ud-file">
                        <span className="ud-file-ph">{i + 1}</span>
                        <span className="ud-file-name">{t('pm.job', { n: i + 1 })}{p.orderId?.orderNumber ? ` · ${p.orderId.orderNumber}` : ''}</span>
                        <span className="ud-file-size"><bdi dir="ltr">{Number(p.widthCm).toFixed(1)} × {Number(p.heightCm).toFixed(1)} cm</bdi></span>
                        <Button variant="ghost" aria-label={t('pm.remove', { n: i + 1 })} onClick={() => remove(i)}>×</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </>
      )}

      {modal === 'new' && <NewPlate onClose={() => setModal(null)} onDone={() => { setModal(null); loadPlates(false); }} />}
      {modal === 'job' && plate && <AddJob plate={plate} plateId={activeId} onPreview={setPreview} onClose={() => setModal(null)} onDone={() => { setModal(null); loadPlate(); }} />}
      {modal === 'close' && (
        <Modal destructive title={t('pm.close.title')} onClose={() => setModal(null)} actions={<><Button variant="secondary" onClick={() => setModal(null)}>{t('pm.keep')}</Button><Button variant="danger" disabled={busy} onClick={closePlate}>{t('pm.close.confirm')}</Button></>}>
          <p>{t('pm.close.text')}</p>
        </Modal>
      )}
    </>
  );
};

export default PlateMonitoring;
