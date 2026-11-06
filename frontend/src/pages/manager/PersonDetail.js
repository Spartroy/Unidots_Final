import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Field, Tabs } from '../../design/controls';
import { Button, DataTable, DefList, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import { ClaimBadge, OPEN_STATUSES } from '../../components/claims/ClaimBits';
import { ActiveBadge } from './People';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Manager: one client or staff member: details, activity, and whether they can sign in.
const PersonDetail = () => {
  const { id } = useParams();
  const { t, lang, dir } = useLanguage();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('details');
  const [orders, setOrders] = useState(null);
  const [claims, setClaims] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [busy, setBusy] = useState(false);

  const isClient = person?.role === 'client';
  const backTo = isClient ? '/manager/clients' : '/manager/employees';
  const actions = useMemo(() => <Link to={backTo} className="ud-btn ud-btn-secondary">{t(isClient ? 'pp.d.back.clients' : 'pp.d.back.staff')}</Link>, [backTo, isClient, t]);
  usePageChrome({ title: person?.name, subtitle: t('pp.subtitle.detail'), actions });

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/api/users/${id}`);
      setPerson(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.status === 404 ? t('pp.d.notFound') : e.response?.data?.message || t('pp.d.loadError'));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!person) return;
    const q = person.role === 'client' ? `client=${id}` : `assignedTo=${id}`;
    api.get(`/api/orders?${q}&limit=50`).then((r) => setOrders(r.data.orders || [])).catch(() => setOrders([]));
    if (person.role === 'client') api.get(`/api/claims?client=${id}`).then((r) => setClaims(Array.isArray(r.data) ? r.data : r.data.claims || [])).catch(() => setClaims([]));
  }, [person, id]);

  const setActive = async (active) => {
    try {
      setBusy(true);
      await api.put(`/api/users/${id}/status`, { status: active ? 'active' : 'inactive' });
      toast.success(t('pp.d.statusDone'));
      setConfirmOff(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || t('pp.d.statusFailed'));
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  if (error && !person) return <Notice tone="error">{error}</Notice>;
  if (!person) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;

  const a = person.address && typeof person.address === 'object' ? person.address : { street: person.address || '' };
  const addressLine = [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ') || '—';
  const active = person.isActive !== false;
  const openClaims = (claims || []).filter((c) => OPEN_STATUSES.includes(c.status)).length;
  const tabs = isClient ? ['details', 'orders', 'claims'] : ['details', 'orders'];

  return (
    <>
      <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 className="ud-card-h">{person.name}</h2>
          <span className="ud-hint">{t(`pp.roleOne.${person.role}`)}</span>
          <ActiveBadge active={active} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setEditing(true)}>{t('pp.d.edit')}</Button>
          {active ? (
            <Button variant="secondary" style={{ color: 'var(--danger)' }} onClick={() => setConfirmOff(true)}>{t('pp.d.deactivate')}</Button>
          ) : (
            <Button onClick={() => setActive(true)} disabled={busy}>{t('pp.d.activate')}</Button>
          )}
        </div>
      </section>

      <Tabs dir={dir} label={person.name} value={tab} onChange={setTab} items={tabs.map((k) => ({ key: k, label: t(`pp.d.tab.${k}`), count: k === 'orders' ? orders?.length : k === 'claims' ? claims?.length : undefined }))} />

      {tab === 'details' && (
        <section className="ud-card ud-root" dir={dir}>
          <DefList
            dir={dir}
            items={[
              [t('pp.col.email'), <bdi dir="ltr">{person.email}</bdi>],
              [t('pp.col.phone'), person.phone ? <bdi dir="ltr">{person.phone}</bdi> : '—'],
              isClient ? [t('pp.col.company'), person.company || '—'] : null,
              isClient ? [t('pp.d.address'), addressLine] : null,
              [t('pp.d.joined'), fmt(person.createdAt)],
              isClient ? [t('pp.d.totalOrders'), orders ? orders.length : '…'] : null,
              isClient ? [t('pp.d.openClaims'), claims ? openClaims : '…'] : null,
            ].filter(Boolean)}
          />
        </section>
      )}

      {tab === 'orders' && (
        <section className="ud-card ud-pad0 ud-root" dir={dir}>
          {!orders ? <Skeleton height={160} /> : orders.length === 0 ? <p className="ud-card-s" style={{ padding: 16 }}>{t('pp.d.noOrders')}</p> : (
            <DataTable
              dir={dir}
              caption={t(isClient ? 'pp.d.ordersFor' : 'pp.d.ordersAssigned')}
              columns={[{ key: 'o', label: t('pp.d.col.order') }, { key: 't', label: t('pp.d.col.title') }, { key: 's', label: t('pp.d.col.status') }, { key: 'd', label: t('pp.d.col.date') }]}
              rows={orders.map((o) => ({ o: <Link className="ud-link" to={`/manager/orders/${o._id}`}>{o.orderNumber}</Link>, t: o.title, s: <OrderStatusBadge status={o.status} />, d: fmt(o.createdAt) }))}
            />
          )}
        </section>
      )}

      {tab === 'claims' && (
        <section className="ud-card ud-pad0 ud-root" dir={dir}>
          {!claims ? <Skeleton height={160} /> : claims.length === 0 ? <p className="ud-card-s" style={{ padding: 16 }}>{t('pp.d.noClaims')}</p> : (
            <DataTable
              dir={dir}
              caption={t('pp.d.tab.claims')}
              columns={[{ key: 'n', label: t('pp.d.col.claim') }, { key: 't', label: t('pp.d.col.title') }, { key: 's', label: t('pp.d.col.status') }, { key: 'd', label: t('pp.d.col.date') }]}
              rows={claims.map((c) => ({ n: <Link className="ud-link" to={`/manager/claims/${c._id}`}>{c.claimNumber}</Link>, t: c.title, s: <ClaimBadge status={c.status} />, d: fmt(c.createdAt) }))}
            />
          )}
        </section>
      )}

      {editing && <EditPerson person={person} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}

      {confirmOff && (
        <Modal
          destructive
          title={t('pp.d.deactivateTitle')}
          onClose={() => setConfirmOff(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmOff(false)}>{t('pp.d.keep')}</Button>
              <Button variant="danger" disabled={busy} onClick={() => setActive(false)}>{t('pp.d.deactivate')}</Button>
            </>
          }
        >
          <p>{t('pp.d.deactivateText')}</p>
        </Modal>
      )}
    </>
  );
};

const EditPerson = ({ person, onClose, onSaved }) => {
  const { t } = useLanguage();
  const isClient = person.role === 'client';
  const a = person.address && typeof person.address === 'object' ? person.address : {};
  const [f, setF] = useState({ name: person.name || '', email: person.email || '', phone: person.phone || '', company: person.company || '', street: a.street || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || '', country: a.country || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (e) => {
    setF((x) => ({ ...x, [e.target.name]: e.target.value }));
    setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = t('pp.add.err.name');
    if (!EMAIL.test(f.email.trim())) er.email = t('pp.add.err.email');
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      setBusy(true);
      await api.put(`/api/users/${person._id}`, {
        name: f.name.trim(), email: f.email.trim(), phone: f.phone,
        ...(isClient ? { company: f.company, address: { street: f.street, city: f.city, state: f.state, postalCode: f.postalCode, country: f.country } } : {}),
      });
      toast.success(t('pp.d.saved'));
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || t('pp.d.saveFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t('pp.d.edit')}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>{t('pp.d.cancel')}</Button>
          <Button type="submit" form="edit-person" disabled={busy}>{t('pp.d.save')}</Button>
        </>
      }
    >
      <form id="edit-person" onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <Field label={t('pp.add.name')} name="name" value={f.name} onChange={set} error={errors.name} required />
        <Field label={t('pp.add.email')} name="email" type="email" dir="ltr" value={f.email} onChange={set} error={errors.email} required />
        <Field label={t('pp.add.phone')} name="phone" type="tel" dir="ltr" value={f.phone} onChange={set} />
        {isClient && (
          <>
            <Field label={t('pp.col.company')} name="company" value={f.company} onChange={set} />
            <Field label={t('pp.d.street')} name="street" value={f.street} onChange={set} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <Field label={t('pp.d.city')} name="city" value={f.city} onChange={set} />
              <Field label={t('pp.d.state')} name="state" value={f.state} onChange={set} />
              <Field label={t('pp.d.postal')} name="postalCode" dir="ltr" value={f.postalCode} onChange={set} />
              <Field label={t('pp.d.country')} name="country" value={f.country} onChange={set} />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default PersonDetail;
