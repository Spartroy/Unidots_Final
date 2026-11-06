import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Progress, DefList, Notice, Button } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import { Field } from '../../design/controls';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import ProcessGrid, { PROCESS_KEYS } from '../../components/prepress/ProcessGrid';
import OrderTimeline from '../../components/common/OrderTimeline';
import { areaM2, solventLiters } from '../../utils/area';
import { openFile } from '../../utils/files';

const isPrepressStaff = (u) => u && (u.role === 'prepress' || u.department === 'prepress' || u.role === 'manager' || u.role === 'admin');

// One order on the floor: the nine processes first, order information and solvent use below.
const PrepressOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t, lang, dir } = useLanguage();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('px.d.loadError'));
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  usePageChrome({ title: order?.title });

  const canEdit = isPrepressStaff(user);
  const subs = order?.stages?.prepress?.subProcesses || {};
  const done = PROCESS_KEYS.filter((k) => subs[k]?.status === 'Completed').length;
  const m2 = order ? areaM2(order.specifications?.dimensions) : 0;

  const updateProcess = async (key, status) => {
    try {
      setBusy(true);
      await api.put(`/api/orders/${id}/prepress-process`, { subProcess: key, status });

      // Washout uses solvent: record it from the plate area (units respected)
      if (key === 'washout' && status === 'Completed' && m2 > 0) {
        try {
          await api.post('/api/acid-solution/usage', { orderId: id, areaProcessed: m2 });
          toast.success(t('px.d.solventRecorded', { liters: solventLiters(m2).toFixed(2) }));
        } catch (_) {
          toast.warning(t('px.d.solventFailed'));
        }
      }

      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
      const s = res.data?.stages?.prepress?.subProcesses || {};
      if (PROCESS_KEYS.every((k) => s[k]?.status === 'Completed')) {
        toast.success(t('px.d.allDone'));
        setTimeout(() => navigate('/prepress/history'), 1800);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('px.d.updateError'));
    } finally {
      setBusy(false);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setSending(true);
      await api.post(`/api/orders/${id}/comments`, { content: comment });
      setComment('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('px.d.commentError'));
    } finally {
      setSending(false);
    }
  };

  if (error && !order) {
    return (
      <>
        <Notice tone="error">{error}</Notice>
        <Link to="/prepress" className="ud-btn ud-btn-secondary ud-btn-lg" style={{ alignSelf: 'flex-start' }}>{t('px.d.back')}</Link>
      </>
    );
  }
  if (!order) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={110} />
        <div className="ud-grid ud-grid-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} height={130} />)}</div>
      </div>
    );
  }

  const spec = order.specifications || {};
  const dim = spec.dimensions || {};
  const unit = dim.unit || 'mm';
  const rep = (dim.widthRepeatCount > 1 || dim.heightRepeatCount > 1) ? ` (${dim.widthRepeatCount || 1}×${dim.heightRepeatCount || 1})` : '';
  const info = [
    [t('px.d.package'), spec.packageType],
    [t('px.d.material'), spec.material],
    [t('px.d.thickness'), spec.materialThickness ? <bdi dir="ltr">{spec.materialThickness} mm</bdi> : '—'],
    [t('px.d.size'), dim.width && dim.height ? <bdi dir="ltr">{`${dim.width} × ${dim.height} ${unit}${rep}`}</bdi> : '—'],
    [t('px.d.colors'), spec.colors],
    [t('px.d.printing'), spec.printingMode],
    spec.jobPath ? [t('px.d.jobPath'), <span dir="ltr">{spec.jobPath}</span>] : null,
    spec.distortion !== undefined && spec.distortion !== null ? [t('px.d.distortion'), `${spec.distortion}%`] : null,
  ].filter(Boolean);
  const clientFiles = (order.files || []).filter((f) => f.uploadedBy?.role === 'client');

  return (
    <>
      <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ud-order-no ud-root">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
          <span style={{ color: 'var(--text-muted)' }}>{t('px.client')}: {order.client?.name || '—'}</span>
        </div>
        <Progress dir={dir} label={t('px.d.completedOf', { n: done })} value={Math.round((done / PROCESS_KEYS.length) * 100)} />
      </section>

      <section dir={dir} aria-labelledby="proc-title">
        <h2 id="proc-title" className="ud-card-h" style={{ marginBottom: 12 }}>{t('px.d.processes')}</h2>
        {!canEdit && <Notice tone="info">{t('px.d.readOnly')}</Notice>}
        <ProcessGrid subProcesses={subs} canEdit={canEdit && ['In Prepress', 'Ready for Delivery'].includes(order.status)} busy={busy} onChange={updateProcess} />
      </section>

      <div className="ud-grid ud-grid-2" dir={dir}>
        <section className="ud-card ud-root">
          <h2 className="ud-card-h" style={{ marginBottom: 16 }}>{t('px.d.info')}</h2>
          <DefList dir={dir} items={info} />
        </section>
        <section className="ud-card ud-root">
          <h2 className="ud-card-h">{t('px.d.solvent')}</h2>
          <p className="ud-card-s">{t('px.d.solventNote')}</p>
          <DefList
            dir={dir}
            cols={2}
            items={[
              [t('px.d.area'), <bdi key="a" dir="ltr">{m2.toFixed(3)} m²</bdi>],
              [t('px.d.liters'), <bdi key="l" dir="ltr">{solventLiters(m2).toFixed(2)} L</bdi>],
            ]}
          />
        </section>
      </div>

      {(clientFiles.length > 0 || (order.designLinks || []).length > 0) && (
        <section className="ud-card ud-root" dir={dir}>
          {clientFiles.length > 0 && (
            <>
              <h2 className="ud-card-h">{t('px.d.files')}</h2>
              <ul className="ud-files" style={{ marginBlockStart: 8 }}>
                {clientFiles.map((f) => (
                  <li key={f._id} className="ud-file">
                    <span className="ud-file-ph">{(f.originalname || '').split('.').pop().toUpperCase().slice(0, 4)}</span>
                    <span className="ud-file-name">{f.originalname || f.filename}</span>
                    <button type="button" className="ud-btn ud-btn-secondary" onClick={(e) => openFile(e, f._id)}>{t('px.d.download')}</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {(order.designLinks || []).length > 0 && (
            <>
              <h2 className="ud-card-h" style={{ marginBlockStart: 20 }}>{t('px.d.links')}</h2>
              <ul className="ud-files" style={{ marginBlockStart: 8 }}>
                {order.designLinks.map((l, i) => (
                  <li key={i} className="ud-file">
                    <span className="ud-file-name" dir="ltr">{l.link}</span>
                    <a className="ud-btn ud-btn-secondary" href={l.link} target="_blank" rel="noopener noreferrer">{t('px.d.open')}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="ud-card ud-root" dir={dir} aria-labelledby="comments-title">
        <h2 id="comments-title" className="ud-card-h">{t('px.d.comments')}</h2>
        {(order.comments || []).length === 0 ? (
          <p className="ud-card-s">{t('px.d.noComments')}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: '12px 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.comments.map((c, i) => (
              <li key={c._id || i} style={{ borderBlockEnd: '1px solid var(--border)', paddingBlockEnd: 12 }}>
                <b>{c.author?.name}</b>{' '}
                <span className="ud-hint">{new Date(c.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{c.content}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={sendComment} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
          <Field label={t('px.d.addComment')} multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          <Button type="submit" disabled={sending || !comment.trim()} style={{ alignSelf: 'flex-start' }}>{t('px.d.send')}</Button>
        </form>
      </section>

      <OrderTimeline orderId={order._id} refreshKey={done} />

      <div className="ud-actionbar ud-root" dir={dir}>
        <Link to="/prepress" className="ud-btn ud-btn-secondary ud-btn-lg">{t('px.d.back')}</Link>
      </div>
    </>
  );
};

export default PrepressOrderDetail;
