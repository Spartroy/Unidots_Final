import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, DefList, Notice } from '../../design/kit';
import { Field, Select } from '../../design/controls';
import { COLORS, MATERIALS, PACKAGE_TYPES, PRINTING_MODES, THICKNESSES, colorCount, emptyForm, estimatePrice, formFromOrder, validateStep } from '../../utils/orderForm';

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
);

// Client: place a new order in three steps (basics, specifications, review). The draft is kept on this device.
const NewOrder = () => {
  const { user } = useContext(AuthContext);
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const reorderFrom = location.state?.reorderFrom;
  const draftKey = `unidots_order_draft_${user?._id || user?.id || 'anon'}`;
  usePageChrome({ title: t('dash.newOrder'), subtitle: t('wiz.subtitle') });

  const [form, setForm] = useState(() => (reorderFrom ? formFromOrder(reorderFrom) : emptyForm()));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  // Bring back an unfinished draft (not when reordering)
  useEffect(() => {
    if (reorderFrom) return;
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (d?.formData) {
        setForm(d.formData);
        setStep(d.step === 3 ? 2 : d.step || 1);
        setRestored(true);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sp = form.specifications;
    const dirty = form.title || form.description || sp.dimensions.width || sp.dimensions.height || sp.usedColors.length || sp.additionalDetails;
    if (!dirty || busy) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ formData: form, step, savedAt: Date.now() }));
    } catch (_) {}
  }, [form, step, busy, draftKey]);

  const discard = () => {
    try { localStorage.removeItem(draftKey); } catch (_) {}
    setForm(emptyForm());
    setStep(1);
    setErrors({});
    setRestored(false);
  };

  const sp = form.specifications;
  const dim = sp.dimensions;
  const price = useMemo(() => estimatePrice(sp), [sp]);
  const nColors = colorCount(sp.usedColors, sp.customColors);
  const money = (n) => Number(n).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 });

  const setTop = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setSpec = (patch) => setForm((f) => ({ ...f, specifications: { ...f.specifications, ...patch } }));
  const setDim = (patch) => setForm((f) => ({ ...f, specifications: { ...f.specifications, dimensions: { ...f.specifications.dimensions, ...patch } } }));
  const setColors = (used, custom) => setSpec({ usedColors: used, customColors: custom, colors: colorCount(used, custom) });
  const toggleColor = (v) => {
    setErrors((e) => ({ ...e, colors: undefined }));
    setColors(sp.usedColors.includes(v) ? sp.usedColors.filter((c) => c !== v) : [...sp.usedColors, v], sp.customColors);
  };

  const go = (n) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => headingRef.current?.focus(), 0);
  };
  const next = () => {
    const e = validateStep(step, form);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.warn(t('wiz.fixErrors'));
      return setTimeout(() => document.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.focus?.(), 0);
    }
    go(step + 1);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (step < 3) return next();
    for (const n of [1, 2]) {
      const e = validateStep(n, form);
      if (Object.keys(e).length) {
        setErrors(e);
        return go(n);
      }
    }
    try {
      setBusy(true);
      await api.post('/api/orders', {
        ...form,
        title: form.title.trim(),
        specifications: { ...sp, customColors: sp.customColors.filter((c) => c.trim()) },
        priority: 'Medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      try { localStorage.removeItem(draftKey); } catch (_) {}
      toast.success(t('wiz.sent'));
      navigate('/client/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || t('wiz.failed'));
    } finally {
      setBusy(false);
    }
  };

  const num = (label, value, onChange, extra = {}) => (
    <Field label={label} type="number" inputMode="decimal" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} {...extra} />
  );
  const sizeError = errors.size && t(errors.size);
  const stepLabels = [t('wizard.step1'), t('wizard.step2'), t('wizard.step3')];
  const colorsText = [...sp.usedColors.map((c) => t(`wiz.color.${c}`)), ...sp.customColors.filter((c) => c.trim())].join(', ');

  const review = [
    [t('wiz.name'), form.title, 1],
    [t('wiz.package'), t(`wiz.package.${sp.packageType}`), 2],
    [t('wiz.size'), <bdi dir="ltr">{`${dim.width} × ${dim.height} ${dim.unit}${dim.widthRepeatCount > 1 || dim.heightRepeatCount > 1 ? ` (${dim.widthRepeatCount} × ${dim.heightRepeatCount})` : ''}`}</bdi>, 2],
    [t('wiz.material'), <bdi dir="ltr">{`${sp.material}, ${sp.materialThickness} mm`}</bdi>, 2],
    [t('wiz.colors'), colorsText, 2],
    [t('wiz.printing'), t(`wiz.printing.${sp.printingMode}`), 2],
  ];

  return (
    <form onSubmit={submit} noValidate dir={dir} style={{ display: 'grid', gap: 16, maxWidth: 1000 }}>
      {reorderFrom && <Notice tone="info">{t('wiz.reorder', { name: reorderFrom.orderNumber || reorderFrom.title })}</Notice>}
      {restored && (
        <Notice tone="warn">
          {t('wizard.draft.restored')} <button type="button" className="ud-link" onClick={discard}>{t('wizard.draft.discard')}</button>
        </Notice>
      )}

      <ol aria-label={t('wizard.progress')} style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {stepLabels.map((l, i) => {
          const n = i + 1;
          const state = n === step ? 'current' : n < step ? 'done' : 'todo';
          return (
            <li key={l} aria-current={state === 'current' ? 'step' : undefined} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ height: 4, borderRadius: 4, background: state === 'todo' ? 'var(--border)' : 'var(--accent)', transition: 'background var(--dur-base) var(--ease-out)' }} />
              <div style={{ marginBlockStart: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: state === 'current' ? 600 : 400, color: state === 'todo' ? 'var(--text-muted)' : 'var(--text)' }}>
                {state === 'done' ? <Check /> : <span aria-hidden="true">{n}.</span>} {l}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="ud-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <div key={step} className="ud-rise" style={{ display: 'grid', gap: 16, gridColumn: 'span 1' }}>
          {step === 1 && (
            <section className="ud-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h1 ref={headingRef} tabIndex={-1} className="ud-card-h" style={{ outline: 'none' }}>{t('wiz.basics')}</h1>
              <Field id="no-title" label={t('wiz.name')} hint={t('wiz.nameHint')} value={form.title} onChange={(e) => { setTop('title', e.target.value); setErrors((x) => ({ ...x, title: undefined })); }} error={errors.title && t(errors.title)} required maxLength={120} />
              <Field label={t('wiz.description')} hint={t('wiz.descriptionHint')} multiline rows={4} value={form.description} onChange={(e) => setTop('description', e.target.value)} />
              <fieldset className="ud-radios ud-root" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="ud-label">{t('wiz.orderType')}</legend>
                {['New Order', 'Existing'].map((v) => (
                  <div className="ud-radio-row" key={v}>
                    <label className="ud-radio"><input type="radio" name="orderType" checked={form.orderType === v} onChange={() => setTop('orderType', v)} /><span><b>{t(`wiz.type.${v}`)}</b></span></label>
                  </div>
                ))}
              </fieldset>
            </section>
          )}

          {step === 2 && (
            <>
              <section className="ud-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h1 ref={headingRef} tabIndex={-1} className="ud-card-h" style={{ outline: 'none' }}>{t('wiz.specs')}</h1>
                <Select label={t('wiz.package')} value={sp.packageType} onChange={(e) => setSpec({ packageType: e.target.value })} options={PACKAGE_TYPES.map((v) => ({ value: v, label: t(`wiz.package.${v}`) }))} />
                <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                  <legend className="ud-label" style={{ marginBlockEnd: 8 }}>{t('wiz.size')}</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {num(t('wiz.width'), dim.width, (v) => { setDim({ width: v }); setErrors((x) => ({ ...x, size: undefined })); }, { min: 1, step: 0.1, required: true, 'aria-invalid': errors.size ? 'true' : undefined })}
                    {num(t('wiz.height'), dim.height, (v) => { setDim({ height: v }); setErrors((x) => ({ ...x, size: undefined })); }, { min: 1, step: 0.1, required: true, 'aria-invalid': errors.size ? 'true' : undefined })}
                    <Select label={t('wiz.unit')} value={dim.unit} onChange={(e) => setDim({ unit: e.target.value })} options={['mm', 'cm', 'inch']} />
                  </div>
                  {sizeError && <span className="ud-error" role="alert">{sizeError}</span>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                    {num(t('wiz.widthRepeat'), dim.widthRepeatCount, (v) => setDim({ widthRepeatCount: Math.max(1, parseInt(v, 10) || 1) }), { min: 1, step: 1 })}
                    {num(t('wiz.heightRepeat'), dim.heightRepeatCount, (v) => setDim({ heightRepeatCount: Math.max(1, parseInt(v, 10) || 1) }), { min: 1, step: 1 })}
                  </div>
                </fieldset>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <Select label={t('wiz.material')} value={sp.material} onChange={(e) => setSpec({ material: e.target.value })} options={MATERIALS} />
                  <Select label={t('wiz.thickness')} value={sp.materialThickness} onChange={(e) => setSpec({ materialThickness: Number(e.target.value) })} options={THICKNESSES.map((v) => String(v))} />
                  <Select label={t('wiz.printing')} value={sp.printingMode} onChange={(e) => setSpec({ printingMode: e.target.value })} options={PRINTING_MODES.map((v) => ({ value: v, label: t(`wiz.printing.${v}`) }))} />
                </div>
              </section>

              <section className="ud-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <fieldset className="ud-colors ud-root" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby="colors-hint">
                  <legend className="ud-label">{t('wiz.colors')} <span className="ud-req" aria-hidden="true">*</span></legend>
                  <p id="colors-hint" className="ud-hint" style={{ margin: '0 0 8px' }}>{t('wiz.colorsHint')}</p>
                  <div className="ud-color-grid">
                    {COLORS.map((c) => (
                      <label key={c.value} className="ud-coloropt">
                        <input type="checkbox" checked={sp.usedColors.includes(c.value)} onChange={() => toggleColor(c.value)} />
                        <span className="ud-swatch" style={{ background: c.swatch }} />
                        {t(`wiz.color.${c.value}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <div className="ud-label">{t('wiz.custom')}</div>
                  <p className="ud-hint" style={{ margin: '0 0 8px' }}>{t('wiz.customHint')}</p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {sp.customColors.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input className="ud-input" aria-label={`${t('wiz.customPlaceholder')} ${i + 1}`} placeholder={t('wiz.customPlaceholder')} value={c} onChange={(e) => { setErrors((x) => ({ ...x, colors: undefined })); setColors(sp.usedColors, sp.customColors.map((v, j) => (j === i ? e.target.value : v))); }} />
                        <Button type="button" variant="secondary" aria-label={t('wiz.customRemove', { n: i + 1 })} onClick={() => setColors(sp.usedColors, sp.customColors.filter((_, j) => j !== i))}>×</Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="secondary" style={{ marginBlockStart: 8 }} onClick={() => setColors(sp.usedColors, [...sp.customColors, ''])}>+ {t('wiz.customAdd')}</Button>
                </div>
                {errors.colors && <span className="ud-error" role="alert" data-invalid="true">{t(errors.colors)}</span>}
                <p className="ud-hint" style={{ margin: 0 }} aria-live="polite">{t('wiz.colorCount', { n: nColors })}</p>
              </section>

              <section className="ud-card">
                <Field label={t('wiz.notes')} hint={t('wiz.notesHint')} multiline rows={4} value={sp.additionalDetails} onChange={(e) => setSpec({ additionalDetails: e.target.value })} />
              </section>
            </>
          )}

          {step === 3 && (
            <section className="ud-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h1 ref={headingRef} tabIndex={-1} className="ud-card-h" style={{ outline: 'none' }}>{t('wizard.review.title')}</h1>
                <p className="ud-card-s">{t('wizard.review.subtitle')}</p>
              </div>
              <DefList
                dir={dir}
                cols={1}
                items={review.map(([label, value, to]) => [
                  label,
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ overflowWrap: 'anywhere' }}>{value || '—'}</span>
                    <button type="button" className="ud-link" onClick={() => go(to)}>{t('wizard.edit')}</button>
                  </span>,
                ])}
              />
            </section>
          )}
        </div>

        <aside className="ud-card ud-rise" style={{ '--i': 1, position: 'sticky', insetBlockStart: 16, display: 'flex', flexDirection: 'column', gap: 8 }} aria-live="polite">
          <div className="ud-label">{step === 3 ? t('wizard.price.label') : t('wiz.estimate')}</div>
          {price > 0 ? (
            <div style={{ font: '700 32px/40px var(--font-sans)' }}><bdi dir="ltr">{money(price)}</bdi> <span style={{ fontSize: 16, fontWeight: 600 }}>EGP</span></div>
          ) : (
            <p className="ud-card-s" style={{ margin: 0 }}>{t('wiz.estimateEmpty')}</p>
          )}
          <p className="ud-hint" style={{ margin: 0 }}>{t('wizard.price.note')}</p>
          <p className="ud-hint" style={{ margin: 0 }}>{t('wiz.draftSaved')}</p>
        </aside>
      </div>

      <div className="ud-actionbar ud-root" dir={dir}>
        {step === 1 ? (
          <Button type="button" variant="secondary" onClick={() => navigate('/client/orders')}>{t('wizard.cancel')}</Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => go(step - 1)}>{t('wizard.back')}</Button>
        )}
        <span className="ud-spacer" />
        {step < 3 ? (
          <Button type="submit">{t('wizard.next')}</Button>
        ) : (
          <Button type="submit" disabled={busy}>{busy ? t('wizard.submitting') : t('wizard.submit')}</Button>
        )}
      </div>
    </form>
  );
};

export default NewOrder;
