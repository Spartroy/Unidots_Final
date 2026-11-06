import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, Check, Notice, DefList } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { openFile } from '../../utils/files';

const modeKey = { direct: 'cr.mode.direct', 'client-collection': 'cr.mode.clientCollection', 'shipping-company': 'cr.mode.shipping' };

// One delivery: who and where, three huge actions (call, map, confirm), and the shipment label for carrier jobs.
const CourierOrderDetail = () => {
  const { id } = useParams();
  const { t, lang, dir } = useLanguage();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [labelFile, setLabelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('cr.notFound'));
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);
  usePageChrome({ title: order ? `${order.orderNumber}` : undefined });

  const uploadLabel = async () => {
    if (!labelFile) {
      toast.error(t('cr.pickFile'));
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('files', labelFile);
      fd.append('relatedOrder', id);
      fd.append('fileType', 'courier');
      fd.append('notes', 'Shipment label');
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLabelFile(null);
      if (fileInput.current) fileInput.current.value = '';
      toast.success(t('cr.uploaded'));
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('cr.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const confirmDelivery = async () => {
    try {
      setConfirming(true);
      await api.put(`/api/orders/${id}/status`, { status: 'Completed' });
      toast.success(t('cr.confirmed'));
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('cr.confirmError'));
    } finally {
      setConfirming(false);
    }
  };

  if (error && !order) {
    return (
      <>
        <Notice tone="error">{error}</Notice>
        <Link to="/courier" className="ud-btn ud-btn-secondary ud-btn-lg" style={{ alignSelf: 'flex-start' }}>{t('cr.back')}</Link>
      </>
    );
  }
  if (!order) {
    return (
      <div role="status" aria-label={t('common.loading')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={130} />
        <Skeleton height={200} />
      </div>
    );
  }

  const info = order.stages?.delivery?.courierInfo || {};
  const mode = info.mode;
  const isShipping = mode === 'shipping-company';
  const dest = info.destination;
  const done = order.status === 'Completed';
  const addressLine = dest ? [dest.street, dest.city, dest.state, dest.postalCode, dest.country].filter(Boolean).join(', ') : '';
  const phone = order.client?.phone;
  const labels = (order.files || []).filter((f) => f.fileType === 'courier');
  const bigAction = { size: 'lg', className: 'ud-big', style: { minHeight: 'var(--tap-courier)' } };

  return (
    <>
      <section className="ud-card ud-root ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="ud-order-no">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
          <span className="ud-badge" style={{ background: 'var(--selected)', color: 'var(--accent-ink)' }}>{t(modeKey[mode] || 'cr.mode.direct')}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{order.client?.name}{order.client?.company ? ` · ${order.client.company}` : ''}</div>
        <div style={{ color: 'var(--text-muted)' }}>{order.title}</div>
      </section>

      {done && (
        <Notice tone="success" title={t('cr.completed')} dir={dir}>
          {t('cr.deliveredOn', { date: new Date(order.stages?.delivery?.completionDate || order.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') })}
        </Notice>
      )}

      {!isShipping && (
        <section className="ud-card ud-root" dir={dir} aria-labelledby="addr-title">
          <h2 id="addr-title" className="ud-card-h">{mode === 'client-collection' ? t('cr.collectAddress') : t('cr.address')}</h2>
          {addressLine ? <p style={{ margin: '4px 0 16px', fontSize: 16 }}>{addressLine}</p> : <p className="ud-card-s">—</p>}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {phone ? (
              <a href={`tel:${phone}`} className="ud-btn ud-btn-secondary ud-btn-lg ud-big" style={{ minHeight: 'var(--tap-courier)' }} aria-label={`${t('cr.call')} ${order.client?.name || ''}`}>
                {t('cr.call')} <bdi dir="ltr">{phone}</bdi>
              </a>
            ) : (
              <Button variant="secondary" disabled {...bigAction}>{t('cr.noPhone')}</Button>
            )}
            {addressLine && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`} target="_blank" rel="noreferrer" className="ud-btn ud-btn-secondary ud-btn-lg ud-big" style={{ minHeight: 'var(--tap-courier)' }}>
                {t('cr.map')}
              </a>
            )}
          </div>
        </section>
      )}

      {isShipping && (
        <section className="ud-card ud-root" dir={dir} aria-labelledby="ship-title">
          <h2 id="ship-title" className="ud-card-h">{t('cr.company')}</h2>
          <DefList dir={dir} cols={1} items={[[t('cr.company'), info.shipmentCompany || t('cr.defaultCompany')]]} />
          <h3 className="ud-card-h" style={{ marginBlockStart: 20 }}>{t('cr.label')}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBlockStart: 8 }}>
            <input ref={fileInput} id="label-file" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setLabelFile(e.target.files?.[0] || null)} />
            <label htmlFor="label-file" className="ud-btn ud-btn-secondary ud-btn-lg" style={{ minHeight: 'var(--tap-courier)', cursor: 'pointer' }}>{t('cr.chooseFile')}</label>
            {labelFile && <span style={{ color: 'var(--text-muted)', overflowWrap: 'anywhere' }} dir="ltr">{labelFile.name}</span>}
            <Button size="lg" onClick={uploadLabel} disabled={uploading || !labelFile} style={{ minHeight: 'var(--tap-courier)' }}>
              {uploading ? t('cr.uploading') : t('cr.upload')}
            </Button>
          </div>
          {labels.length > 0 && (
            <>
              <h3 className="ud-card-h" style={{ marginBlockStart: 20 }}>{t('cr.labels')}</h3>
              <ul className="ud-files">
                {labels.map((f) => (
                  <li key={f._id} className="ud-file">
                    <span className="ud-file-name">{f.originalname || f.filename}</span>
                    <button type="button" className="ud-btn ud-btn-secondary" onClick={(e) => openFile(e, f._id)}>{t('cr.download')}</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {!done && (
        <div className="ud-actionbar ud-root" dir={dir}>
          <Button size="lg" onClick={confirmDelivery} disabled={confirming} className="ud-big ud-confirm" style={{ minHeight: 'var(--tap-courier)', width: '100%' }}>
            <Check size={24} />
            {t('cr.confirm')}
          </Button>
        </div>
      )}
      <div dir={dir}>
        <Link to="/courier" className="ud-btn ud-btn-ghost ud-btn-lg">{t('cr.back')}</Link>
      </div>
    </>
  );
};

export default CourierOrderDetail;
