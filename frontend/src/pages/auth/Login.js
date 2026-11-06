import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout, Button, Notice } from '../../design/kit';
import { Field } from '../../design/controls';
import usePageTitle from '../../utils/usePageTitle';
import logoWhite from '../../assets/logo-white.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const location = useLocation();
  const { t, lang, setLang, dir } = useLanguage();
  usePageTitle(`${t('login.title')} | UniDots`);

  // Where the user was heading before being sent here (route guard state, or ?from= after a session expiry)
  const params = new URLSearchParams(location.search);
  const fromState = location.state?.from;
  const from = fromState ? `${fromState.pathname || ''}${fromState.search || ''}` : params.get('from') || undefined;
  const sessionExpired = params.get('expired') === '1';

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error(t('login.errorMissing'));
      return;
    }
    try {
      setIsSubmitting(true);
      await login(formData.email.trim(), formData.password, from);
    } catch (error) {
      if (error.response) toast.error(error.response.data?.message || t('login.errorInvalid'));
      else if (error.request) toast.error(t('login.errorNetwork'));
      else toast.error(t('login.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      dir={dir}
      brand={<img src={logoWhite} alt="UniDots" style={{ width: 168, height: 'auto' }} />}
      title={t('login.asideTitle')}
      text={t('login.asideText')}
      points={[t('login.point1'), t('login.point2'), t('login.point3')]}
      back={
        <Link to="/" className="ud-link ud-back">
          {t('login.backHome')}
        </Link>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBlockEnd: 8 }}>
        <div className="ud-lang" role="group" aria-label="Language / اللغة" style={{ borderColor: 'var(--border-control)' }}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} style={{ color: lang === 'en' ? undefined : 'var(--text)' }}>EN</button>
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} style={{ color: lang === 'ar' ? undefined : 'var(--text)' }}>عربي</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <h1 style={{ margin: 0, font: '700 28px/36px var(--font-sans)' }}>{t('login.welcomeBack')}</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('login.subtitle')}</p>

        {sessionExpired && <Notice tone="info">{t('login.expired')}</Notice>}

        <Field
          label={t('login.email')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          dir="ltr"
        />
        <Field
          label={t('login.password')}
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          dir="ltr"
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            {t('login.showPassword')}
          </label>
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </Button>

        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {t('login.newTo')}{' '}
          <Link to="/register" className="ud-link">{t('login.createAccount')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
