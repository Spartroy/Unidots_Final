import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import StatusExplainer from '../../components/client/StatusExplainer';
import QuoteCard from '../../components/client/QuoteCard';
import { AttachmentList, FilePicker } from '../../components/claims/ClaimBits';
import { stepperIndex } from '../../utils/orderStatus';
import { stageStates } from '../../utils/orderFlow';
import { valueLabel } from '../../utils/orderForm';

const TABS = ['details', 'progress', 'files', 'chat'];
const CANCELLABLE = ['Submitted', 'In Review'];
const ORDER_FILES = { 'image/jpeg': [], 'image/png': [], 'application/pdf': [], 'application/postscript': ['.eps', '.ai'], 'application/illustrator': ['.ai'] };

// Client: one order. Where it is, what it needs from you, its details and files.
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { t, lang, dir } = useLanguage();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'details';

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/api/orders/${id}`);
      setOrder(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.status === 404 || e.response?.status === 403 ? t('co.notFound') : e.response?.data?.message || t('co.loadError'));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const actions = useMemo(() => <Link to="/client/orders" className="ud-btn ud-btn-secondary">{t('co.back')}</Link>, [t]);
  usePageChrome({ title: order?.title, actions });

  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const cancel = async () => {
    try {
      setCancelling(true);
      await api.put(`/api/orders/${id}/cancel`, { reason });
      toast.success(t('co.cancelled'));
      setConfirmCancel(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('co.cancelFailed'));
    } finally {
      setCancelling(false);
    }
  };

  const upload = async () => {
    try {
      setUploading(true);
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('relatedOrder', id);
      fd.append('fileType', 'reference');
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('co.uploaded'));
      setFiles([]);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('co.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  if (error && !order) return <Notice tone="error">{error}</Notice>;
  if (!order) return <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Skeleton height={140} /><Skeleton height={280} /></div>;

  const spec = order.specifications || {};
  const dim = spec.dimensions || {};
  const unit = dim.unit || 'cm';
  const states = stageStates(order);
  const word = (s) => t(`co.stage.${s === 'done' ? 'done' : s === 'current' ? 'inProgress' : 'waiting'}`);
  const price = order.quote?.status === 'Approved'
    ? { label: t('co.quoted'), v: `${Number(order.quote.amount).toLocaleString(locale)} ${order.quote.currency}` }
    : order.cost?.estimatedCost
      ? { label: t('co.estimate'), v: `${Number(order.cost.estimatedCost).toLocaleString(locale)} ${order.cost.currency || ''}`, note: t('co.estimateNote') }
      : null;
  const colorList = [...(spec.usedColors || []), ...(spec.customColors || [])].join(', ');
  const cancellable = CANCELLABLE.includes(order.status);
  const cancelled = order.status === 'Cancelled';

  const info = [
    [t('co.type'), valueLabel(t, 'wiz.type', order.orderType)],
    [t('co.package'), valueLabel(t, 'wiz.package', spec.packageType)],
    [t('co.material'), spec.material || '—'],
    [t('co.thickness'), spec.materialThickness ? <bdi dir="ltr">{spec.materialThickness} mm</bdi> : '—'],
    [t('co.size'), dim.width && dim.height ? <bdi dir="ltr">{`${dim.width} × ${dim.height} ${unit}`}</bdi> : '—'],
    [t('co.repeat'), <bdi dir="ltr">{`${dim.widthRepeatCount || 1} × ${dim.heightRepeatCount || 1}`}</bdi>],
    [t('co.colors'), spec.colors || '—'],
    colorList ? [t('co.colorList'), colorList] : null,
    [t('co.printing'), valueLabel(t, 'wiz.printing', spec.printingMode)],
    [t('co.deadline'), fmtDate(order.deadline)],
    [t('co.designer'), order.assignedTo?.name || t('co.noDesigner')],
    price ? [price.label, <span><bdi dir="ltr">{price.v}</bdi>{price.note && <span className="ud-hint" style={{ display: 'block' }}>{price.note}</span>}</span>] : null,
  ].filter(Boolean);

  const stages = [
    { title: t('co.stage.submission'), state: states.submission, note: fmtDate(order.createdAt) },
    { title: t('co.stage.design'), state: states.design, note: order.assignedTo?.name ? t('co.stage.designer', { name: order.assignedTo.name }) : word(states.design) },
    { title: t('co.stage.ripping'), state: states.ripping, note: word(states.ripping) },
    { title: t('co.stage.prepress'), state: states.prepress, note: word(states.prepress) },
    { title: t('co.stage.delivery'), state: states.delivery, note: word(states.delivery) },
  ];

  return (
    <>
      <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ud-order-no ud-root">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
          <span style={{ color: 'var(--text-muted)' }}>{t('co.created', { date: fmtDate(order.createdAt) })}</span>
        </div>
        {!cancelled && <OrderStepper dir={dir} current={stepperIndex(order.status)} steps={[t('step.submission'), t('step.design'), t('step.ripping'), t('step.prepress'), t('step.delivery')]} label={t('dash.progress')} />}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/client/orders/new" state={{ reorderFrom: order }} className="ud-btn ud-btn-secondary">{t('co.reorder')}</Link>
          {!cancelled && <Link to={`/client/claims/new?orderId=${order._id}`} className="ud-btn ud-btn-secondary">{t('co.claim')}</Link>}
          {cancellable && <Button variant="secondary" style={{ color: 'var(--danger)' }} onClick={() => setConfirmCancel(true)}>{t('co.cancel')}</Button>}
        </div>
      </section>

      <StatusExplainer status={order.status} />
      <QuoteCard order={order} onChanged={load} />

      <Tabs dir={dir} label={t('nav.orders')} value={tab} onChange={(k) => setParams(k === 'details' ? {} : { tab: k }, { replace: true })} items={TABS.map((k) => ({ key: k, label: t(`co.tab.${k}`), count: k === 'files' ? (order.files || []).length || undefined : undefined }))} />

      {tab === 'details' && (
        <div className="ud-grid ud-grid-2" dir={dir}>
          <section className="ud-card ud-root"><h2 className="ud-card-h" style={{ marginBottom: 16 }}>{t('co.spec')}</h2><DefList dir={dir} items={info} cols={1} /></section>
          {(order.description || spec.additionalDetails) && (
            <section className="ud-card ud-root" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.description && <><h2 className="ud-card-h">{t('co.description')}</h2><p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{order.description}</p></>}
              {spec.additionalDetails && <><h2 className="ud-card-h">{t('co.notes')}</h2><p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{spec.additionalDetails}</p></>}
            </section>
          )}
        </div>
      )}

      {tab === 'progress' && <section className="ud-card ud-root"><ProgressTimeline dir={dir} stages={stages} doneLabel={t('co.doneLabel')} /></section>}

      {tab === 'files' && (
        <section className="ud-card ud-root" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="ud-card-h">{t('co.files')}</h2>
          {(order.files || []).length === 0 ? <p className="ud-card-s">{t('co.noFiles')}</p> : <AttachmentList files={order.files} />}
          {!cancelled && (
            <>
              <h3 style={{ margin: '8px 0 0', font: '600 16px/24px var(--font-sans)' }}>{t('co.addFiles')}</h3>
              <FilePicker files={files} onChange={setFiles} disabled={uploading} accept={ORDER_FILES} maxBytes={50 * 1024 * 1024} hint={t('co.addFilesHint')} label={t('co.addFiles')} />
              {files.length > 0 && <div><Button onClick={upload} disabled={uploading}>{uploading ? t('co.uploading') : t('co.upload')}</Button></div>}
            </>
          )}
        </section>
      )}

      {tab === 'chat' && (
        <section className="ud-card ud-root" dir={dir}>
          <h2 className="ud-card-h" style={{ marginBottom: 12 }}>{t('co.chat')}</h2>
          {order.assignedTo ? <OrderChat orderId={order._id} isVisible /> : <Notice tone="info">{t('co.chatWaiting')}</Notice>}
        </section>
      )}

      <OrderTimeline orderId={order._id} refreshKey={order.updatedAt} />

      {confirmCancel && (
        <Modal
          destructive
          title={t('co.cancelTitle')}
          onClose={() => setConfirmCancel(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmCancel(false)}>{t('co.keep')}</Button>
              <Button variant="danger" disabled={cancelling} onClick={cancel}>{cancelling ? t('co.cancelling') : t('co.cancel')}</Button>
            </>
          }
        >
          <p>{t('co.cancelText')}</p>
          <Field label={t('co.cancelReason')} multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </Modal>
      )}
    </>
  );
};

export default OrderDetail;
