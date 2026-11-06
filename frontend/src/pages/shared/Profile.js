import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Field, Select } from '../../design/controls';
import { Button, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blank = { name: '', email: '', phone: '', company: '', defaultDesigner: '', street: '', city: '', state: '', postalCode: '', country: '' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };

const Card = ({ title, hint, children, i = 0 }) => (
  <section className="ud-card ud-rise" style={{ '--i': i, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div>
      <h2 className="ud-card-h">{title}</h2>
      {hint && <p className="ud-card-s">{hint}</p>}
    </div>
    {children}
  </section>
);

const Segmented = ({ id, label, value, onChange, items }) => (
  <div>
    <div className="ud-label" id={id}>{label}</div>
    <div className="ud-lang" role="group" aria-labelledby={id} style={{ marginBlockStart: 6, borderColor: 'var(--border-control)' }}>
      {items.map((it) => (
        <button key={it.key} type="button" aria-pressed={value === it.key} onClick={() => value !== it.key && onChange(it.key)} style={{ color: value === it.key ? undefined : 'var(--text)' }}>
          {it.label}
        </button>
      ))}
    </div>
  </div>
);

// One profile page for every role: details, password and device preferences.
const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const { t, lang, setLang, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  usePageChrome({ subtitle: t('pf.subtitle') });

  const isClient = user?.role === 'client';
  const [f, setF] = useState(blank);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    api
      .get('/api/users/profile')
      .then((r) => {
        const d = r.data;
        setF({
          name: d.name || '',
          email: d.email || '',
          phone: d.phone || '',
          company: d.company || '',
          defaultDesigner: d.defaultDesigner?._id || d.defaultDesigner || '',
          street: d.address?.street || '',
          city: d.address?.city || '',
          state: d.address?.state || '',
          postalCode: d.address?.postalCode || '',
          country: d.address?.country || '',
        });
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, []);
  useEffect(() => {
    if (isClient) api.get('/api/users/public/employees').then((r) => setDesigners(r.data.users || [])).catch(() => {});
  }, [isClient]);

  const set = (e) => {
    const { name, value } = e.target;
    setF((x) => ({ ...x, [name]: value }));
    setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = t('pf.err.name');
    if (!EMAIL.test(f.email.trim())) er.email = t('pf.err.email');
    setErrors(er);
    if (Object.keys(er).length) return;
    const body = { name: f.name.trim(), email: f.email.trim(), phone: f.phone };
    if (isClient) {
      Object.assign(body, {
        company: f.company,
        defaultDesigner: f.defaultDesigner || null,
        address: { street: f.street, city: f.city, state: f.state, postalCode: f.postalCode, country: f.country },
      });
    }
    try {
      setSaving(true);
      await updateProfile(body);
      toast.success(t('pf.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('pf.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pw.currentPassword) er.currentPassword = t('pf.err.current');
    if (pw.newPassword.length < 8) er.newPassword = t('pf.err.short');
    else if (pw.newPassword !== pw.confirmPassword) er.confirmPassword = t('pf.err.match');
    setPwErrors(er);
    if (Object.keys(er).length) return;
    try {
      setPwSaving(true);
      await api.put('/api/users/profile/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('pf.pwSaved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('pf.pwError'));
    } finally {
      setPwSaving(false);
    }
  };

  if (loadError) return <Notice tone="error">{t('pf.loadError')}</Notice>;
  if (!loaded) return <div role="status" aria-label={t('common.loading')}><Skeleton height={360} /></div>;

  const pwField = (name, label, autoComplete) => (
    <Field
      label={label}
      name={name}
      type={showPw ? 'text' : 'password'}
      autoComplete={autoComplete}
      dir="ltr"
      value={pw[name]}
      error={pwErrors[name]}
      required
      onChange={(e) => {
        setPw((x) => ({ ...x, [name]: e.target.value }));
        setPwErrors((x) => ({ ...x, [name]: undefined }));
      }}
    />
  );

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 820 }} dir={dir}>
      <form onSubmit={save} noValidate>
        <Card title={t('pf.personal')} hint={t('pf.personalHint')}>
          <div style={grid}>
            <Field label={t('pf.name')} name="name" value={f.name} onChange={set} error={errors.name} required autoComplete="name" />
            <Field label={t('pf.email')} name="email" type="email" dir="ltr" value={f.email} onChange={set} error={errors.email} required autoComplete="email" />
            <Field label={t('pf.phone')} name="phone" type="tel" dir="ltr" value={f.phone} onChange={set} autoComplete="tel" />
            {isClient && <Field label={t('pf.company')} name="company" value={f.company} onChange={set} autoComplete="organization" />}
          </div>
          {isClient && (
            <>
              <h3 style={{ margin: '8px 0 0', font: '600 16px/24px var(--font-sans)' }}>{t('pf.address')}</h3>
              <Field label={t('pf.street')} name="street" value={f.street} onChange={set} autoComplete="street-address" />
              <div style={grid}>
                <Field label={t('pf.city')} name="city" value={f.city} onChange={set} />
                <Field label={t('pf.state')} name="state" value={f.state} onChange={set} />
                <Field label={t('pf.postal')} name="postalCode" dir="ltr" value={f.postalCode} onChange={set} />
                <Field label={t('pf.country')} name="country" value={f.country} onChange={set} />
              </div>
              <Select
                label={t('pf.designer')}
                hint={t('pf.designerHint')}
                value={f.defaultDesigner}
                onChange={(e) => setF((x) => ({ ...x, defaultDesigner: e.target.value }))}
                options={[{ value: '', label: t('pf.designerNone') }, ...designers.map((d) => ({ value: d._id, label: d.name }))]}
              />
            </>
          )}
          <div><Button type="submit" disabled={saving}>{saving ? t('pf.saving') : t('pf.save')}</Button></div>
        </Card>
      </form>

      <form onSubmit={changePassword} noValidate>
        <Card i={1} title={t('pf.security')} hint={t('pf.securityHint')}>
          <div style={grid}>
            {pwField('currentPassword', t('pf.current'), 'current-password')}
            {pwField('newPassword', t('pf.new'), 'new-password')}
            {pwField('confirmPassword', t('pf.confirm'), 'new-password')}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
            {t('pf.show')}
          </label>
          <div><Button type="submit" variant="secondary" disabled={pwSaving}>{pwSaving ? t('pf.saving') : t('pf.change')}</Button></div>
        </Card>
      </form>

      <Card i={2} title={t('pf.prefs')} hint={t('pf.prefsHint')}>
        <div style={grid}>
          <Segmented id="pf-lang" label={t('pf.language')} value={lang} onChange={setLang} items={[{ key: 'en', label: 'EN' }, { key: 'ar', label: 'عربي' }]} />
          <Segmented id="pf-theme" label={t('pf.theme')} value={theme} onChange={toggleTheme} items={[{ key: 'light', label: t('pf.light') }, { key: 'dark', label: t('pf.dark') }]} />
        </div>
      </Card>
    </div>
  );
};

export default Profile;
