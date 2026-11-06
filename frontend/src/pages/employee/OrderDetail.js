import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, DefList, Notice, OrderStepper, ProgressTimeline } from '../../design/kit';
import { Field, Tabs } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import OrderTimeline from '../../components/common/OrderTimeline';
import OrderChat from '../../components/common/OrderChat';
import { AttachmentList, FilePicker } from '../../components/claims/ClaimBits';
import { stepperIndex } from '../../utils/orderStatus';
import { stageStates } from '../../utils/orderFlow';
import { valueLabel } from '../../utils/orderForm';

const TABS = ['details', 'progress', 'files', 'comments', 'chat'];
const WORK_FILES = { 'image/jpeg': [], 'image/png': [], 'application/pdf': [], 'application/postscript': ['.eps', '.ai'], 'application/illustrator': ['.ai'] };
const BIG = 50 * 1024 * 1024;
const PAST_DELIVERY = ['Ready for Delivery', 'Delivering', 'Completed', 'Delivered', 'Cancelled'];

// Design or ripping: upload files and/or a link, then move the order on.
const WorkModal = ({ kind, onClose, onDone, orderId, order }) => {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length && !link.trim()) return toast.error(t('ew.work.need'));
    try {
      setBusy(true);
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('relatedOrder', orderId);
      fd.append('fileType', kind);
      fd.append('notes', notes || (kind === 'design' ? 'Completed design files' : 'Ripping files'));
      if (link.trim()) fd.append('designLink', link.trim());
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (kind === 'design') {
        await api.put(`/api/orders/${orderId}/status`, { status: 'Design Done' });
        toast.success(t('ew.work.designDone'));
      } else {
        if (order.status === 'Designing') await api.put(`/api/orders/${orderId}/status`, { status: 'Design Done' });
        await api.put(`/api/orders/${orderId}/ripping-complete`, {});
        toast.success(t('ew.work.rippingDone'));
      }
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || t('ew.work.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t(`ew.${kind}.title`)}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>{t('ew.work.cancel')}</Button>
          <Button type="submit" form="work-form" disabled={busy}>{busy ? t('ew.work.working') : t('ew.work.submit')}</Button>
        </>
      }
    >
      <p>{t(`ew.${kind}.text`)}</p>
      <form id="work-form" onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <FilePicker files={files} onChange={setFiles} disabled={busy} accept={WORK_FILES} maxBytes={BIG} hint={t('ew.work.hint')} label={t('ew.work.files')} />
        <Field label={t('ew.work.link')} hint={t('ew.work.linkHint')} type="url" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} />
        <Field label={t('ew.work.notes')} multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
};

const DeliveryModal = ({ onClose, onDone, orderId }) => {
  const { t } = useLanguage();
  const [method, setMethod] = useState('direct');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      await api.post(`/api/orders/${orderId}/choose-delivery`, {
        deliveryMethod: method,
        shipmentCompany: method === 'shipping-company' ? 'Middle East' : undefined,
        tempAddress: method === 'direct' && address.trim() ? address.trim() : undefined,
      });
      toast.success(t('ew.del.done'));
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || t('ew.del.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t('ew.del.title')}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>{t('ew.work.cancel')}</Button>
          <Button type="submit" form="del-form" disabled={busy}>{t('ew.del.confirm')}</Button>
        </>
      }
    >
      <form id="del-form" onSubmit={submit} noValidate>
        <fieldset className="ud-radios ud-root" style={{ border: 0, padding: 0, margin: 0 }}>
          {[['direct', 'ew.del.direct'], ['client-collection', 'ew.del.collect'], ['shipping-company', 'ew.del.ship']].map(([v, k]) => (
            <div className="ud-radio-row" key={v}>
              <label className="ud-radio"><input type="radio" name="method" checked={method === v} onChange={() => setMethod(v)} /><span><b>{t(k)}</b></span></label>
              {method === v && v === 'direct' && (
                <div className="ud-radio-extra"><Field label={t('ew.del.address')} hint={t('ew.del.directHint')} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              )}
            </div>
          ))}
        </fieldset>
      </form>
    </Modal>
  );
};

// Designer: one order. What to do next, the details, files, comments and client chat.
const EmployeeOrderDetail = () => {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, lang, dir } = useLanguage();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'design' | 'ripping' | 'delivery' | 'delivered'
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [picked, setPicked] = useState([]);
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'details';

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/api/orders/${id}`);
      setOrder(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('mg.d.loadError'));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const actions = useMemo(() => (
    <>
      <Link to="/employee/orders" className="ud-btn ud-btn-secondary">{t('ew.back')}</Link>
      <Link to={`/employee/orders/${id}/edit`} className="ud-btn ud-btn-secondary">{t('ew.edit')}</Link>
    </>
  ), [id, t]);
  usePageChrome({ title: order?.title, actions });

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
  const fmtTime = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const status = async (s, ok) => {
    try {
      setBusy(true);
      await api.put(`/api/orders/${id}/status`, { status: s });
      toast.success(ok);
      setModal(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('ew.statusFailed'));
    } finally {
      setBusy(false);
    }
  };
  const done = () => { setModal(null); load(); };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setBusy(true);
      await api.post(`/api/orders/${id}/comments`, { content: comment });
      setComment('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('mg.d.commentError'));
    } finally {
      setBusy(false);
    }
  };
  const upload = async () => {
    try {
      setBusy(true);
      const fd = new FormData();
      picked.forEach((f) => fd.append('files', f));
      fd.append('relatedOrder', id);
      fd.append('fileType', 'reference');
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('mg.d.uploaded'));
      setPicked([]);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('mg.d.uploadError'));
    } finally {
      setBusy(false);
    }
  };

  if (error && !order) return <Notice tone="error">{error}</Notice>;
  if (!order) return <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Skeleton height={150} /><Skeleton height={300} /></div>;

  const spec = order.specifications || {};
  const dim = spec.dimensions || {};
  const states = stageStates(order);
  const prepressDone = order.stages?.prepress?.status === 'Completed';
  const mode = order.stages?.delivery?.courierInfo?.mode;

  // The one thing to do next, and the buttons that go with it
  let next = { text: t('ew.next.waiting'), buttons: [] };
  if (order.status === 'Awaiting Approval') next = { text: t('ew.next.quote'), buttons: [] };
  else if (order.status === 'Submitted') next = { text: t('ew.next.start'), buttons: [{ k: 'start', primary: true, run: () => status('Designing', t('ew.started')) }] };
  else if (order.status === 'Designing') next = { text: t('ew.next.designing'), buttons: [{ k: 'design', primary: true, run: () => setModal('design') }, { k: 'ripping', run: () => setModal('ripping') }] };
  else if (order.status === 'Design Done') next = { text: t('ew.next.ripping'), buttons: [{ k: 'ripping', primary: true, run: () => setModal('ripping') }] };
  else if (prepressDone && !PAST_DELIVERY.includes(order.status)) next = { text: t('ew.next.delivery'), buttons: [{ k: 'delivery', primary: true, run: () => setModal('delivery') }] };
  else if (order.status === 'Ready for Delivery' && mode === 'direct') next = { text: t('ew.next.handover'), buttons: [{ k: 'delivered', primary: true, run: () => setModal('delivered') }] };

  const stageNote = (s) => t(`mg.d.stage.${s === 'done' ? 'done' : s === 'current' ? 'inProgress' : 'waiting'}`);
  const stages = [
    { title: t('mg.d.stage.submission'), state: states.submission, note: fmtDate(order.createdAt) },
    { title: t('mg.d.stage.design'), state: states.design, note: stageNote(states.design) },
    { title: t('mg.d.stage.ripping'), state: states.ripping, note: stageNote(states.ripping) },
    { title: t('mg.d.stage.prepress'), state: states.prepress, note: stageNote(states.prepress) },
    { title: t('mg.d.stage.delivery'), state: states.delivery, note: stageNote(states.delivery) },
  ];
  const info = [
    [t('mg.d.type'), valueLabel(t, 'wiz.type', order.orderType)],
    [t('mg.d.package'), valueLabel(t, 'wiz.package', spec.packageType)],
    [t('mg.d.material'), spec.material || '—'],
    [t('mg.d.thickness'), spec.materialThickness ? <bdi dir="ltr">{spec.materialThickness} mm</bdi> : '—'],
    [t('mg.d.size'), dim.width && dim.height ? <bdi dir="ltr">{`${dim.width} × ${dim.height} ${dim.unit || 'mm'} (${dim.widthRepeatCount || 1} × ${dim.heightRepeatCount || 1})`}</bdi> : '—'],
    [t('mg.d.colors'), [spec.colors, [...(spec.usedColors || []), ...(spec.customColors || [])].join(', ')].filter(Boolean).join(' · ') || '—'],
    [t('mg.d.printing'), valueLabel(t, 'wiz.printing', spec.printingMode)],
    [t('mg.d.deadline'), fmtDate(order.deadline)],
    spec.jobPath ? [t('mg.d.jobPath'), <bdi dir="ltr">{spec.jobPath}</bdi>] : null,
    spec.distortion !== undefined && spec.distortion !== null && spec.distortion !== '' ? [t('mg.d.distortion'), `${spec.distortion}%`] : null,
  ].filter(Boolean);

  return (
    <>
      <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ud-order-no ud-root">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
          <span style={{ color: 'var(--text-muted)' }}>{order.client?.name}{order.client?.company ? ` · ${order.client.company}` : ''}</span>
        </div>
        <OrderStepper dir={dir} current={stepperIndex(order.status)} steps={[t('step.submission'), t('step.design'), t('step.ripping'), t('step.prepress'), t('step.delivery')]} label={t('dash.progress')} />
      </section>

      <section className="ud-card ud-rise" dir={dir} style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
        <div className="ud-label">{t('ew.next')}</div>
        <p style={{ margin: 0, font: '600 18px/26px var(--font-sans)' }}>{next.text}</p>
        {next.buttons.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {next.buttons.map((b) => (
              <Button key={b.k} size="lg" variant={b.primary ? 'primary' : 'secondary'} disabled={busy} onClick={b.run}>{t(`ew.act.${b.k}`)}</Button>
            ))}
          </div>
        )}
      </section>

      <Tabs dir={dir} label={t('nav.orders')} value={tab} onChange={(k) => setParams(k === 'details' ? {} : { tab: k }, { replace: true })} items={TABS.map((k) => ({ key: k, label: k === 'chat' ? t('ew.tab.chat') : t(`mg.tab.${k}`), count: k === 'files' ? (order.files || []).length || undefined : k === 'comments' ? (order.comments || []).length || undefined : undefined }))} />

      {tab === 'details' && (
        <div className="ud-grid ud-grid-2" dir={dir}>
          <section className="ud-card ud-root"><h2 className="ud-card-h" style={{ marginBottom: 16 }}>{t('mg.d.order')}</h2><DefList dir={dir} cols={1} items={info} /></section>
          <section className="ud-card ud-root" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="ud-card-h">{t('mg.d.client')}</h2>
            <DefList dir={dir} cols={1} items={[[t('mg.d.name'), order.client?.name || '—'], [t('mg.d.company'), order.client?.company || '—'], [t('mg.d.phone'), <bdi dir="ltr">{order.client?.phone || '—'}</bdi>]]} />
            {(order.description || spec.additionalDetails) && (
              <>
                <h3 className="ud-card-h">{t('mg.d.notes')}</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{[order.description, spec.additionalDetails].filter(Boolean).join('\n\n')}</p>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'progress' && <section className="ud-card ud-root"><ProgressTimeline dir={dir} stages={stages} doneLabel={t('mg.d.doneLabel')} /></section>}

      {tab === 'files' && (
        <section className="ud-card ud-root" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="ud-card-h">{t('mg.d.files')}</h2>
          {(order.files || []).length === 0 ? <p className="ud-card-s">{t('mg.d.noFiles')}</p> : <AttachmentList files={order.files} />}
          <FilePicker files={picked} onChange={setPicked} disabled={busy} accept={WORK_FILES} maxBytes={BIG} hint={t('ew.work.hint')} label={t('mg.d.upload')} />
          {picked.length > 0 && <div><Button onClick={upload} disabled={busy}>{busy ? t('mg.d.uploading') : t('mg.d.upload')}</Button></div>}
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
                  <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={sendComment} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
            <Field label={t('mg.d.addComment')} multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
            <Button type="submit" disabled={busy || !comment.trim()} style={{ alignSelf: 'flex-start' }}>{t('mg.d.send')}</Button>
          </form>
        </section>
      )}

      {tab === 'chat' && (
        <section className="ud-card ud-root" dir={dir}>
          {order.assignedTo ? <OrderChat orderId={order._id} isVisible /> : <Notice tone="info">{t('ew.chat.empty')}</Notice>}
        </section>
      )}

      <OrderTimeline orderId={order._id} refreshKey={order.updatedAt} />

      {(modal === 'design' || modal === 'ripping') && <WorkModal kind={modal} orderId={id} order={order} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'delivery' && <DeliveryModal orderId={id} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'delivered' && (
        <Modal
          title={t('ew.delivered.title')}
          onClose={() => setModal(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>{t('ew.keep')}</Button>
              <Button disabled={busy} onClick={() => status('Completed', t('ew.delivered.done'))}>{t('ew.delivered.confirm')}</Button>
            </>
          }
        >
          <p>{t('ew.delivered.text')}</p>
        </Modal>
      )}
    </>
  );
};

export default EmployeeOrderDetail;
