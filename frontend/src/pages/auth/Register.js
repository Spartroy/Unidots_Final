import React, { useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout, Button } from '../../design/kit';
import { Field } from '../../design/controls';
import usePageTitle from '../../utils/usePageTitle';
import logoWhite from '../../assets/logo-white.png';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const empty = { name: '', email: '', password: '', confirmPassword: '', company: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'Egypt' };

// Client sign-up in three short steps. Only clients can self-register; staff accounts are created by a manager.
const Register = () => {
  const { register } = useContext(AuthContext);
  const { t, lang, setLang, dir } = useLanguage();
  usePageTitle(`${t('reg.title')} | UniDots`);

  const [step, setStep] = useState(1);
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  const set = (e) => {
    const { name, value } = e.target;
    setF((x) => ({ ...x, [name]: value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const check = (n) => {
    const e = {};
    if (n === 1) {
      if (!f.name.trim()) e.name = t('reg.err.name');
      if (!EMAIL.test(f.email.trim())) e.email = t('reg.err.email');
    }
    if (n === 2) {
      if (f.password.length < 8) e.password = t('reg.err.password');
      else if (f.password !== f.confirmPassword) e.confirmPassword = t('reg.err.match');
    }
    if (n === 3) {
      ['company', 'phone', 'street', 'city', 'state', 'postalCode'].forEach((k) => {
        if (!String(f[k]).trim()) e[k] = t(`reg.err.${k === 'postalCode' ? 'postal' : k}`);
      });
    }
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`reg-${first}`)?.focus();
    return !first;
  };

  const go = (n) => {
    setStep(n);
    setTimeout(() => headingRef.current?.focus(), 0);
  };
  const next = () => check(step) && go(step + 1);

  const submit = async (e) => {
    e.preventDefault();
    if (step < 3) return next();
    if (!check(3)) return;
    const { confirmPassword, street, city, state, postalCode, country, ...rest } = f;
    try {
      setBusy(true);
      await register({
        ...rest,
        name: f.name.trim(),
        email: f.email.trim(),
        role: 'client',
        address: { street, city, state, postalCode, country: country || 'Egypt' },
      });
    } catch (err) {
      if (err.response) toast.error(err.response.data?.message || t('reg.err.failed'));
      else if (err.request) toast.error(t('reg.err.network'));
      else toast.error(t('reg.err.failed'));
    } finally {
      setBusy(false);
    }
  };

  const fld = (name, label, extra = {}) => (
    <Field id={`reg-${name}`} label={label} name={name} value={f[name]} onChange={set} error={errors[name]} required {...extra} />
  );
  const labels = [t('reg.step1'), t('reg.step2'), t('reg.step3')];

  return (
    <AuthLayout
      dir={dir}
      brand={<img src={logoWhite} alt="UniDots" style={{ width: 168, height: 'auto' }} />}
      title={t('reg.asideTitle')}
      text={t('reg.asideText')}
      points={[t('reg.point1'), t('reg.point2'), t('reg.point3')]}
      back={<Link to="/" className="ud-link ud-back">{t('login.backHome')}</Link>}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBlockEnd: 8 }}>
        <div className="ud-lang" role="group" aria-label="Language / اللغة" style={{ borderColor: 'var(--border-control)' }}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} style={{ color: lang === 'en' ? undefined : 'var(--text)' }}>EN</button>
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} style={{ color: lang === 'ar' ? undefined : 'var(--text)' }}>عربي</button>
        </div>
      </div>

      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
        <h1 ref={headingRef} tabIndex={-1} style={{ margin: 0, font: '700 28px/36px var(--font-sans)', outline: 'none' }}>{t('reg.heading')}</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('reg.subtitle')}</p>

        <ol aria-label={t('reg.step', { n: step, total: 3 })} style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
          {labels.map((l, i) => (
            <li key={l} aria-current={step === i + 1 ? 'step' : undefined} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ height: 4, borderRadius: 4, background: step >= i + 1 ? 'var(--accent)' : 'var(--border)', transition: 'background var(--dur-base) var(--ease-out)' }} />
              <div style={{ marginBlockStart: 6, fontSize: 13, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)' }}>{l}</div>
            </li>
          ))}
        </ol>

        <div key={step} className="ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <>
              {fld('name', t('reg.name'), { autoComplete: 'name' })}
              {fld('email', t('reg.email'), { type: 'email', autoComplete: 'email', dir: 'ltr', hint: t('reg.emailHint') })}
            </>
          )}
          {step === 2 && (
            <>
              {fld('password', t('reg.password'), { type: show ? 'text' : 'password', autoComplete: 'new-password', dir: 'ltr', hint: t('reg.passwordHint') })}
              {fld('confirmPassword', t('reg.confirm'), { type: show ? 'text' : 'password', autoComplete: 'new-password', dir: 'ltr' })}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                {t('reg.show')}
              </label>
            </>
          )}
          {step === 3 && (
            <>
              {fld('company', t('reg.company'), { autoComplete: 'organization' })}
              {fld('phone', t('reg.phone'), { type: 'tel', autoComplete: 'tel', dir: 'ltr' })}
              {fld('street', t('reg.street'), { autoComplete: 'street-address' })}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {fld('city', t('reg.city'), { autoComplete: 'address-level2' })}
                {fld('state', t('reg.state'), { autoComplete: 'address-level1' })}
                {fld('postalCode', t('reg.postal'), { autoComplete: 'postal-code', dir: 'ltr' })}
                {fld('country', t('reg.country'), { autoComplete: 'country-name', required: false })}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {step > 1 && <Button type="button" variant="secondary" size="lg" onClick={() => go(step - 1)}>{t('reg.back')}</Button>}
          <Button type="submit" size="lg" disabled={busy} style={{ flex: 1 }}>
            {step < 3 ? t('reg.next') : busy ? t('reg.submitting') : t('reg.submit')}
          </Button>
        </div>

        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {t('reg.haveAccount')}{' '}
          <Link to="/login" className="ud-link">{t('reg.signIn')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
