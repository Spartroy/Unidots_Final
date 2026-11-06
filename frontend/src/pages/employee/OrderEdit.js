import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, Notice } from '../../design/kit';
import { Field, Select } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';
import { COLORS, MATERIALS, PACKAGE_TYPES, PRINTING_MODES, THICKNESSES, colorCount, formFromOrder, validateStep } from '../../utils/orderForm';

// Designer: correct an order's details (size, colours, material, prepress notes).
const OrderEdit = () => {
  const { id } = useParams();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const actions = useMemo(() => <Link to={`/employee/orders/${id}`} className="ud-btn ud-btn-secondary">{t('wizard.cancel')}</Link>, [id, t]);
  usePageChrome({ title: t('ew.edit'), actions });

  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then((r) => setForm({ ...formFromOrder(r.data), orderType: r.data.orderType || 'New Order' }))
      .catch((e) => setError(e.response?.data?.message || t('mg.d.loadError')));
  }, [id, t]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!form) return <div role="status" aria-label={t('common.loading')}><Skeleton height={400} /></div>;

  const sp = form.specifications;
  const dim = sp.dimensions;
  const setTop = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSpec = (patch) => setForm((f) => ({ ...f, specifications: { ...f.specifications, ...patch } }));
  const setDim = (patch) => setForm((f) => ({ ...f, specifications: { ...f.specifications, dimensions: { ...f.specifications.dimensions, ...patch } } }));
  const setColors = (used, custom) => setSpec({ usedColors: used, customColors: custom, colors: colorCount(used, custom) });
  const toggle = (v) => setColors(sp.usedColors.includes(v) ? sp.usedColors.filter((c) => c !== v) : [...sp.usedColors, v], sp.customColors);

  const submit = async (e) => {
    e.preventDefault();
    const er = { ...validateStep(1, form), ...validateStep(2, form) };
    setErrors(er);
    if (Object.keys(er).length) return toast.warn(t('wiz.fixErrors'));
    try {
      setBusy(true);
      await api.put(`/api/orders/${id}`, { ...form, title: form.title.trim(), specifications: { ...sp, customColors: sp.customColors.filter((c) => c.trim()) } });
      toast.success(t('pf.saved'));
      navigate(`/employee/orders/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('pf.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const num = (label, value, onChange, extra = {}) => <Field label={label} type="number" inputMode="decimal" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} {...extra} />;

  return (
    <form onSubmit={submit} noValidate dir={dir} style={{ display: 'grid', gap: 16, maxWidth: 820 }}>
      <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="ud-card-h">{t('wiz.basics')}</h2>
        <Field label={t('wiz.name')} value={form.title} onChange={(e) => setTop({ title: e.target.value })} error={errors.title && t(errors.title)} required maxLength={120} />
        <Field label={t('wiz.description')} multiline rows={3} value={form.description} onChange={(e) => setTop({ description: e.target.value })} />
        <Select label={t('wiz.orderType')} value={form.orderType} onChange={(e) => setTop({ orderType: e.target.value })} options={['New Order', 'Existing'].map((v) => ({ value: v, label: t(`wiz.type.${v}`) }))} />
      </section>

      <section className="ud-card ud-rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="ud-card-h">{t('wiz.specs')}</h2>
        <Select label={t('wiz.package')} value={sp.packageType} onChange={(e) => setSpec({ packageType: e.target.value })} options={PACKAGE_TYPES.map((v) => ({ value: v, label: t(`wiz.package.${v}`) }))} />
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          <legend className="ud-label" style={{ marginBlockEnd: 8 }}>{t('wiz.size')}</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {num(t('wiz.width'), dim.width, (v) => setDim({ width: v }), { min: 1, step: 0.1, required: true })}
            {num(t('wiz.height'), dim.height, (v) => setDim({ height: v }), { min: 1, step: 0.1, required: true })}
            <Select label={t('wiz.unit')} value={dim.unit} onChange={(e) => setDim({ unit: e.target.value })} options={['mm', 'cm', 'inch']} />
          </div>
          {errors.size && <span className="ud-error" role="alert">{t(errors.size)}</span>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {num(t('wiz.widthRepeat'), dim.widthRepeatCount, (v) => setDim({ widthRepeatCount: Math.max(1, parseInt(v, 10) || 1) }), { min: 1, step: 1 })}
            {num(t('wiz.heightRepeat'), dim.heightRepeatCount, (v) => setDim({ heightRepeatCount: Math.max(1, parseInt(v, 10) || 1) }), { min: 1, step: 1 })}
          </div>
        </fieldset>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Select label={t('wiz.material')} value={sp.material} onChange={(e) => setSpec({ material: e.target.value })} options={MATERIALS} />
          <Select label={t('wiz.thickness')} value={sp.materialThickness} onChange={(e) => setSpec({ materialThickness: Number(e.target.value) })} options={THICKNESSES.map(String)} />
          <Select label={t('wiz.printing')} value={sp.printingMode} onChange={(e) => setSpec({ printingMode: e.target.value })} options={PRINTING_MODES.map((v) => ({ value: v, label: t(`wiz.printing.${v}`) }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {num(t('mg.d.distortion'), sp.distortion, (v) => setSpec({ distortion: v }), { min: 0, max: 100, step: 0.1 })}
          <Field label={t('mg.d.jobPath')} dir="ltr" value={sp.jobPath} onChange={(e) => setSpec({ jobPath: e.target.value })} />
        </div>
      </section>

      <section className="ud-card ud-rise" style={{ '--i': 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <fieldset className="ud-colors ud-root" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ud-label">{t('wiz.colors')}</legend>
          <div className="ud-color-grid">
            {COLORS.map((c) => (
              <label key={c.value} className="ud-coloropt">
                <input type="checkbox" checked={sp.usedColors.includes(c.value)} onChange={() => toggle(c.value)} />
                <span className="ud-swatch" style={{ background: c.swatch }} />
                {t(`wiz.color.${c.value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="ud-label">{t('wiz.custom')}</div>
          {sp.customColors.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input className="ud-input" aria-label={`${t('wiz.customPlaceholder')} ${i + 1}`} value={c} onChange={(e) => setColors(sp.usedColors, sp.customColors.map((v, j) => (j === i ? e.target.value : v)))} />
              <Button type="button" variant="secondary" aria-label={t('wiz.customRemove', { n: i + 1 })} onClick={() => setColors(sp.usedColors, sp.customColors.filter((_, j) => j !== i))}>×</Button>
            </div>
          ))}
          <div><Button type="button" variant="secondary" onClick={() => setColors(sp.usedColors, [...sp.customColors, ''])}>+ {t('wiz.customAdd')}</Button></div>
        </div>
        {errors.colors && <span className="ud-error" role="alert">{t(errors.colors)}</span>}
        <p className="ud-hint" style={{ margin: 0 }}>{t('wiz.colorCount', { n: colorCount(sp.usedColors, sp.customColors) })}</p>
        <Field label={t('wiz.notes')} multiline rows={3} value={sp.additionalDetails} onChange={(e) => setSpec({ additionalDetails: e.target.value })} />
      </section>

      <div className="ud-actionbar ud-root" dir={dir}>
        <Link to={`/employee/orders/${id}`} className="ud-btn ud-btn-secondary">{t('wizard.cancel')}</Link>
        <span className="ud-spacer" />
        <Button type="submit" disabled={busy}>{busy ? t('pf.saving') : t('pf.save')}</Button>
      </div>
    </form>
  );
};

export default OrderEdit;
