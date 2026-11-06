import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, DefList, Notice, OrderStepper, PriorityBadge, ProgressTimeline } from '../../design/kit';
import { Field, Select, Tabs } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import OrderTimeline from '../../components/common/OrderTimeline';
import QuotePanel from '../../components/manager/QuotePanel';
import { PROCESS_KEYS } from '../../components/prepress/ProcessGrid';
import { stepperIndex } from '../../utils/orderStatus';
import { stageStates, nextStep } from '../../utils/orderFlow';
import { openFile } from '../../utils/files';
import { valueLabel } from '../../utils/orderForm';

const TABS = ['details', 'progress', 'files', 'comments'];
const CLOSED = ['Completed', 'Delivered', 'Cancelled'];

// Manager: one order. Who has it, where it is, what to do next, and everything that happened.
const ManagerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { t, lang, dir } = useLanguage();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'details';

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
      setChosen((c) => c || res.data.assignedTo?._id || '');
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('mg.d.loadError'));
    }
  }, [id, t]);

  useEffect(() => {
    load();
    api.get('/api/users?role=employee&isActive=true&limit=100').then((r) => setEmployees(r.data.users || [])).catch(() => {});
  }, [load]);
  useAutoRefresh(load, 60000, [load]);
  usePageChrome({ title: order?.title });

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
  const fmtTime = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const run = async (fn, okMsg, errMsg) => {
    try {
      setBusy(true);
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || errMsg);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status) => run(() => api.put(`/api/orders/${id}/status`, { status }), t('mg.d.statusUpdated'), t('mg.d.statusError'));
  const assign = () => run(() => api.put(`/api/orders/${id}/assign`, { employeeId: chosen }), t('mg.assigned'), t('mg.assignError'));

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setSending(true);
      await api.post(`/api/orders/${id}/comments`, { content: comment });
      setComment('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('mg.d.commentError'));
    } finally {
      setSending(false);
    }
  };

  const upload = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    try {
      setUploading(true);
      const fd = new FormData();
      picked.forEach((f) => fd.append('files', f));
      fd.append('relatedOrder', id);
      fd.append('fileType', 'manager');
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('mg.d.uploaded'));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('mg.d.uploadError'));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  if (error && !order) {
    return (
      <>
        <Notice tone="error">{error}</Notice>
        <Link to="/manager/orders" className="ud-btn ud-btn-secondary" style={{ alignSelf: 'flex-start' }}>{t('mg.d.back')}</Link>
      </>
    );
  }
  if (!order) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={150} />
        <Skeleton height={300} />
      </div>
    );
  }

  const spec = order.specifications || {};
  const dim = spec.dimensions || {};
  const closed = CLOSED.includes(order.status);
  const step = nextStep(order);
  const states = stageStates(order);
  const subs = order.stages?.prepress?.subProcesses || {};
  const price = order.quote?.status === 'Approved' ? { label: t('mg.d.quoted'), v: `${Number(order.quote.amount).toLocaleString()} ${order.quote.currency}` } : order.cost?.estimatedCost ? { label: t('mg.d.estimate'), v: `${Number(order.cost.estimatedCost).toLocaleString()} ${order.cost.currency || ''}` } : null;
  const address = order.client?.address;
  const addressLine = address && typeof address === 'object' ? [address.street, address.city, address.state, address.country].filter(Boolean).join(', ') : address || '—';

  const orderInfo = [
    [t('mg.d.type'), valueLabel(t, 'wiz.type', order.orderType)],
    [t('mg.d.package'), valueLabel(t, 'wiz.package', spec.packageType)],
    [t('mg.d.material'), spec.material],
    [t('mg.d.thickness'), spec.materialThickness ? <bdi dir="ltr">{spec.materialThickness} mm</bdi> : '—'],
    [t('mg.d.size'), dim.width && dim.height ? <bdi dir="ltr">{`${dim.width} × ${dim.height} ${dim.unit || 'mm'}`}</bdi> : '—'],
    [t('mg.d.colors'), spec.colors],
    [t('mg.d.printing'), valueLabel(t, 'wiz.printing', spec.printingMode)],
    [t('mg.d.created'), fmtDate(order.createdAt)],
    [t('mg.d.deadline'), fmtDate(order.deadline)],
    spec.jobPath ? [t('mg.d.jobPath'), <bdi dir="ltr">{spec.jobPath}</bdi>] : null,
    spec.distortion !== undefined && spec.distortion !== null ? [t('mg.d.distortion'), `${spec.distortion}%`] : null,
    price ? [price.label, <bdi dir="ltr">{price.v}</bdi>] : null,
  ].filter(Boolean);

  const stages = [
    { title: t('mg.d.stage.submission'), state: states.submission, note: fmtDate(order.createdAt) },
    { title: t('mg.d.stage.design'), state: states.design, note: order.assignedTo?.name || t('mg.notAssigned') },
    { title: t('mg.d.stage.ripping'), state: states.ripping, note: t(`mg.d.stage.${states.ripping === 'done' ? 'done' : states.ripping === 'current' ? 'inProgress' : 'waiting'}`) },
    {
      title: t('mg.d.stage.prepress'),
      state: states.prepress,
      note: t(`mg.d.stage.${states.prepress === 'done' ? 'done' : states.prepress === 'current' ? 'inProgress' : 'waiting'}`),
      subsTitle: t('mg.d.subsTitle'),
      subs: PROCESS_KEYS.map((k) => ({ label: t(`process.${k}`), done: subs[k]?.status === 'Completed' })),
    },
    { title: t('mg.d.stage.delivery'), state: states.delivery, note: t(`mg.d.stage.${states.delivery === 'done' ? 'done' : states.delivery === 'current' ? 'inProgress' : 'waiting'}`) },
  ];

  return (
    <>
      <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ud-order-no ud-root">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
          {order.priority && <PriorityBadge level={String(order.priority).toLowerCase()} label={t(`mg.priority.${String(order.priority).toLowerCase()}`) === `mg.priority.${String(order.priority).toLowerCase()}` ? order.priority : undefined} />}
          <span style={{ color: 'var(--text-muted)' }}>{order.client?.name}{order.client?.company ? ` · ${order.client.company}` : ''}</span>
        </div>
        <OrderStepper dir={dir} current={stepperIndex(order.status)} steps={[t('step.submission'), t('step.design'), t('step.ripping'), t('step.prepress'), t('step.delivery')]} label={t('dash.progress')} />
        {order.status === 'Awaiting Approval' && <Notice tone="warn">{t('mg.d.waitingClient')}</Notice>}
      </section>

      {!closed && (
        <section className="ud-card" dir={dir} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: '1 1 260px' }}>
            <Select label={t('mg.d.assignedTo')} value={chosen} onChange={(e) => setChosen(e.target.value)} options={[{ value: '', label: t('mg.notAssigned') }, ...employees.map((u) => ({ value: u._id, label: u.name }))]} />
          </div>
          <Button variant={step?.type === 'assign' ? 'primary' : 'secondary'} onClick={assign} disabled={busy || !chosen || chosen === (order.assignedTo?._id || '')}>{t('mg.assign')}</Button>
        </section>
      )}

      <QuotePanel order={order} onChanged={load} />

      <Tabs dir={dir} label={t('nav.orders')} value={tab} onChange={(k) => setParams(k === 'details' ? {} : { tab: k }, { replace: true })} items={TABS.map((k) => ({ key: k, label: t(`mg.tab.${k}`), count: k === 'files' ? (order.files || []).length : k === 'comments' ? (order.comments || []).length : undefined }))} />

      {tab === 'details' && (
        <div className="ud-grid ud-grid-2" dir={dir}>
          <section className="ud-card ud-root"><h2 className="ud-card-h" style={{ marginBottom: 16 }}>{t('mg.d.order')}</h2><DefList dir={dir} items={orderInfo} /></section>
          <section className="ud-card ud-root">
            <h2 className="ud-card-h" style={{ marginBottom: 16 }}>{t('mg.d.client')}</h2>
            <DefList dir={dir} items={[[t('mg.d.name'), order.client?.name || '—'], [t('mg.d.company'), order.client?.company || '—'], [t('mg.d.email'), <bdi dir="ltr">{order.client?.email || '—'}</bdi>], [t('mg.d.phone'), <bdi dir="ltr">{order.client?.phone || '—'}</bdi>], [t('mg.d.address'), addressLine]]} />
            {spec.additionalDetails && (<><h3 className="ud-card-h" style={{ marginBlockStart: 20 }}>{t('mg.d.notes')}</h3><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{spec.additionalDetails}</p></>)}
          </section>
        </div>
      )}

      {tab === 'progress' && <section className="ud-card ud-root"><ProgressTimeline dir={dir} stages={stages} doneLabel={t('mg.d.doneLabel')} /></section>}

      {tab === 'files' && (
        <section className="ud-card ud-root" dir={dir}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 className="ud-card-h">{t('mg.d.files')}</h2>
            <>
              <input ref={fileInput} id="mgr-files" type="file" multiple style={{ display: 'none' }} onChange={upload} />
              <label htmlFor="mgr-files" className="ud-btn ud-btn-secondary" style={{ cursor: 'pointer' }}>{uploading ? t('mg.d.uploading') : t('mg.d.chooseFiles')}</label>
            </>
          </div>
          {(order.files || []).length === 0 ? (
            <p className="ud-card-s" style={{ marginBlockStart: 8 }}>{t('mg.d.noFiles')}</p>
          ) : (
            <ul className="ud-files" style={{ marginBlockStart: 12 }}>
              {order.files.map((f) => (
                <li key={f._id} className="ud-file">
                  <span className="ud-file-ph">{(f.originalname || '').split('.').pop().toUpperCase().slice(0, 4)}</span>
                  <span className="ud-file-name">{f.originalname || f.filename}
                    <span className="ud-hint" style={{ display: 'block' }}>{f.uploadedBy?.name ? `${f.uploadedBy.name} · ` : ''}{fmtDate(f.createdAt)}</span>
                  </span>
                  <button type="button" className="ud-btn ud-btn-secondary" onClick={(e) => openFile(e, f._id)}>{t('mg.d.download')}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'comments' && (
        <section className="ud-card ud-root" dir={dir}>
          {(order.comments || []).length === 0 ? (
            <p className="ud-card-s">{t('mg.d.noComments')}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.comments.map((c, i) => (
                <li key={c._id || i} style={{ borderBlockEnd: '1px solid var(--border)', paddingBlockEnd: 12 }}>
                  <b>{c.author?.name}</b> <span className="ud-hint">{fmtTime(c.createdAt)}</span>
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={sendComment} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
            <Field label={t('mg.d.addComment')} multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
            <Button type="submit" disabled={sending || !comment.trim()} style={{ alignSelf: 'flex-start' }}>{t('mg.d.send')}</Button>
          </form>
        </section>
      )}

      <OrderTimeline orderId={order._id} refreshKey={order.updatedAt} />

      <div className="ud-actionbar ud-root" dir={dir}>
        <Link to="/manager/orders" className="ud-btn ud-btn-secondary">{t('mg.d.back')}</Link>
        <span className="ud-spacer" />
        {!closed && order.status !== 'On Hold' && <Button variant="secondary" disabled={busy} onClick={() => setStatus('On Hold')}>{t('mg.d.hold')}</Button>}
        {!closed && <Button variant="secondary" disabled={busy} style={{ color: 'var(--danger)' }} onClick={() => setConfirmCancel(true)}>{t('mg.d.cancelOrder')}</Button>}
        {step && step.status && (
          <Button disabled={busy} onClick={() => setStatus(step.status)}>
            {t(step.type === 'resume' ? 'mg.d.resume' : `mg.d.next.${step.type}`)}
          </Button>
        )}
      </div>

      {confirmCancel && (
        <Modal
          destructive
          title={t('mg.d.cancelTitle')}
          onClose={() => setConfirmCancel(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmCancel(false)}>{t('mg.d.keep')}</Button>
              <Button variant="danger" disabled={busy} onClick={async () => { await setStatus('Cancelled'); setConfirmCancel(false); navigate('/manager/orders'); }}>{t('mg.d.cancelOrder')}</Button>
            </>
          }
        >
          <p>{t('mg.d.cancelText')}</p>
        </Modal>
      )}
    </>
  );
};

export default ManagerOrderDetail;
