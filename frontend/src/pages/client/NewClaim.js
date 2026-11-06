import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, Notice } from '../../design/kit';
import { Field, Select } from '../../design/controls';
import { FilePicker, uploadFiles } from '../../components/claims/ClaimBits';

const TYPES = ['Quality Issue', 'Delivery Problem', 'Incorrect Specifications', 'Damage', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Report a problem with an order. Files are optional and uploaded before the claim is created.
const NewClaim = () => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const preselect = new URLSearchParams(location.search).get('orderId') || '';

  const [orders, setOrders] = useState(null);
  const [f, setF] = useState({ order: preselect, claimType: '', severity: 'Medium', title: '', description: '' });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const actions = useMemo(() => <Link to="/client/claims" className="ud-btn ud-btn-secondary">{t('cl.form.cancel')}</Link>, [t]);
  usePageChrome({ title: t('cl.new'), subtitle: t('cl.subtitle.new'), actions });

  useEffect(() => {
    api.get('/api/orders?limit=100').then((r) => setOrders(r.data.orders || [])).catch(() => setOrders([]));
  }, []);

  const set = (e) => {
    const { name, value } = e.target;
    setF((x) => ({ ...x, [name]: value }));
    setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.order) er.order = t('cl.form.err.order');
    if (!f.claimType) er.claimType = t('cl.form.err.type');
    if (!f.title.trim()) er.title = t('cl.form.err.title');
    if (!f.description.trim()) er.description = t('cl.form.err.description');
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) return document.getElementById(`nc-${first}`)?.focus();
    try {
      setBusy(true);
      const { ids, failed } = await uploadFiles(files, { relatedOrder: f.order });
      const r = await api.post('/api/claims', { ...f, title: f.title.trim(), description: f.description.trim(), files: ids });
      toast.success(t('cl.form.sent'));
      if (failed.length) toast.warn(t('cl.form.fileFailed', { names: failed.join(', ') }));
      navigate(`/client/claims/${r.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('cl.form.failed'));
    } finally {
      setBusy(false);
    }
  };

  const orderOptions = [{ value: '', label: t('cl.form.orderPick') }, ...(orders || []).map((o) => ({ value: o._id, label: `${o.orderNumber} — ${o.title}` }))];
  const sel = (name, label, options, extra = {}) => (
    <Select id={`nc-${name}`} label={label} name={name} value={f[name]} onChange={set} options={options} aria-invalid={errors[name] ? 'true' : undefined} {...extra}>
    </Select>
  );

  return (
    <form onSubmit={submit} noValidate dir={dir} style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
      {preselect && f.order === preselect && <Notice tone="info">{t('cl.form.preselected')}</Notice>}
      {orders && orders.length === 0 && (
        <Notice tone="warn">{t('cl.form.noOrders')} <Link className="ud-link" to="/client/orders/new">{t('dash.newOrder')}</Link></Notice>
      )}

      <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sel('order', t('cl.form.order'), orderOptions)}
        {errors.order && <span className="ud-error" role="alert">{errors.order}</span>}
        {sel('claimType', t('cl.form.type'), [{ value: '', label: t('cl.form.typePick') }, ...TYPES.map((k) => ({ value: k, label: t(`cl.type.${k}`) }))])}
        {errors.claimType && <span className="ud-error" role="alert">{errors.claimType}</span>}
        {sel('severity', t('cl.form.severity'), SEVERITIES.map((k) => ({ value: k, label: t(`cl.sev.${k}`) })))}
        <Field id="nc-title" label={t('cl.form.title')} name="title" value={f.title} onChange={set} error={errors.title} required maxLength={120} />
        <Field id="nc-description" label={t('cl.form.description')} hint={t('cl.form.descriptionHint')} name="description" multiline rows={5} value={f.description} onChange={set} error={errors.description} required />
      </section>

      <section className="ud-card ud-rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="ud-card-h">{t('cl.form.files')}</h2>
        <FilePicker files={files} onChange={setFiles} disabled={busy} />
      </section>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" size="lg" disabled={busy || (orders && orders.length === 0)}>{busy ? t('cl.form.submitting') : t('cl.form.submit')}</Button>
      </div>
    </form>
  );
};

export default NewClaim;
