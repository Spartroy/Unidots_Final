import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import logo from '../assets/logo-teal.png';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import usePageTitle from '../utils/usePageTitle';

const PHONES = ['+201144142992', '+201144142990', '+201117229555'];
const EMAIL = 'info@unidots.com';
const NAV = ['services', 'process', 'about', 'faq', 'contact'];

// The brand's halftone motif: a round field of dots that grow from top-left to bottom-right.
const HalftoneArt = ({ className = '' }) => {
  const size = 11;
  const step = 34;
  const dots = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cx = c * step + step / 2;
      const cy = r * step + step / 2;
      const d = Math.hypot(cx - (size * step) / 2, cy - (size * step) / 2);
      if (d > (size * step) / 2 - 6) continue; // keep it circular
      const radius = 2 + ((r + c) / (2 * (size - 1))) * 12;
      dots.push(<circle key={`${r}-${c}`} cx={cx} cy={cy} r={radius.toFixed(1)} />);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size * step} ${size * step}`}
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {dots}
    </svg>
  );
};

const SERVICES = ['plates', 'design', 'supply', 'delivery'];

const TEAM = [
  { initials: 'TA', name: 'Dr. Tamer Ali', role: 'landing.about.role1', color: 'bg-primary-600' },
  { initials: 'AA', name: 'Eng. Ayman Abdelaziz', role: 'landing.about.role2', color: 'bg-secondary-600' },
  { initials: 'AW', name: 'Eng. Ayman Wanis', role: 'landing.about.role3', color: 'bg-primary-800' },
];

const Landing = () => {
  const { t, lang } = useLanguage();
  usePageTitle(t('landing.hero.title') + ' | UniDots');
  const [menuOpen, setMenuOpen] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ state: 'error', message: t('landing.contact.form.errRequired') });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setStatus({ state: 'error', message: t('landing.contact.form.errEmail') });
      return;
    }
    setStatus({ state: 'sending', message: '' });
    try {
      await api.post('/api/contact', { ...form, language: lang });
      setForm({ name: '', email: '', phone: '', message: '', website: '' });
      setStatus({ state: 'sent', message: t('landing.contact.form.sent') });
    } catch (err) {
      setStatus({ state: 'error', message: err.response?.data?.message || t('landing.contact.form.errSend') });
    }
  };

  const inputClass =
    'block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder-gray-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-primary-700 focus:shadow-lg"
      >
        {t('landing.skip')}
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="UniDots">
            <img src={logo} alt="UniDots Prepress & Supply Co." className="h-16 w-auto" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((id) => (
              <a key={id} href={`#${id}`} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-800">
                {t(`landing.nav.${id}`)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" />
            <Link to="/login" className="hidden rounded-md px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50 sm:inline-flex">
              {t('landing.signIn')}
            </Link>
            <Link to="/register" className="hidden rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 sm:inline-flex">
              {t('landing.getStarted')}
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">{t('nav.openMainMenu')}</span>
              {menuOpen ? <XMarkIcon className="h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 lg:hidden">
            {NAV.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-gray-800 hover:bg-primary-50"
              >
                {t(`landing.nav.${id}`)}
              </a>
            ))}
            <div className="mt-2 flex gap-2 sm:hidden">
              <Link to="/login" className="flex-1 rounded-md border border-primary-300 px-4 py-3 text-center text-sm font-semibold text-primary-800">
                {t('landing.signIn')}
              </Link>
              <Link to="/register" className="flex-1 rounded-md bg-primary-700 px-4 py-3 text-center text-sm font-semibold text-white">
                {t('landing.getStarted')}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary-900 text-white">
          <HalftoneArt className="pointer-events-none absolute -end-24 top-1/2 hidden h-[34rem] w-[34rem] -translate-y-1/2 text-secondary-400 opacity-30 md:block rtl:-scale-x-100" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t('landing.hero.title')}</h1>
              <p className="mt-6 max-w-2xl text-lg text-primary-100 sm:text-xl">{t('landing.hero.subtitle')}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-secondary-400 px-8 py-3 text-base font-semibold text-primary-900 hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-900"
                >
                  {t('landing.hero.primary')}
                </Link>
                <a
                  href="#process"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-primary-300 px-8 py-3 text-base font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-900"
                >
                  {t('landing.hero.secondary')}
                </a>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-primary-100">
                {['fact1', 'fact2', 'fact3'].map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    {t(`landing.hero.${k}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-20 bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.services.title')}</h2>
              <p className="mt-4 text-lg text-gray-600">{t('landing.services.subtitle')}</p>
            </div>
            <ul className="mt-12 divide-y divide-gray-300 border-y border-gray-300">
              {SERVICES.map((key) => (
                <li key={key} className="grid gap-2 py-8 md:grid-cols-3 md:gap-8">
                  <h3 className="text-xl font-semibold text-primary-900">{t(`landing.services.${key}.title`)}</h3>
                  <p className="text-lg text-gray-700 md:col-span-2">{t(`landing.services.${key}.body`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.process.title')}</h2>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="relative">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-lg font-bold text-white">{n}</span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{t(`landing.process.s${n}.title`)}</h3>
                  <p className="mt-2 text-base text-gray-600">{t(`landing.process.s${n}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI tool */}
        <section className="bg-secondary-50 py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">{t('landing.ai.title')}</h2>
              <p className="mt-3 text-lg text-gray-700">{t('landing.ai.body')}</p>
            </div>
            <Link
              to="/DotDeformationDetector"
              className="inline-flex min-h-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-primary-700 px-8 py-3 text-base font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {t('landing.ai.cta')}
            </Link>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.about.title')}</h2>
              <p className="mt-4 text-lg text-gray-600">{t('landing.about.body')}</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-primary-900 p-8 text-white">
                <h3 className="text-xl font-semibold">{t('landing.about.mission')}</h3>
                <ul className="mt-4 space-y-3 text-primary-100">
                  <li>{t('landing.about.mission1')}</li>
                  <li>{t('landing.about.mission2')}</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-primary-800 p-8 text-white">
                <h3 className="text-xl font-semibold">{t('landing.about.vision')}</h3>
                <ul className="mt-4 space-y-3 text-primary-100">
                  <li>{t('landing.about.vision1')}</li>
                  <li>{t('landing.about.vision2')}</li>
                  <li>{t('landing.about.vision3')}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <h3 className="text-xl font-semibold text-gray-900">{t('landing.about.team')}</h3>
                <ul className="mt-4 space-y-4">
                  {TEAM.map((m) => (
                    <li key={m.name} className="flex items-center gap-4">
                      <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${m.color}`} aria-hidden="true">
                        {m.initials}
                      </span>
                      <span>
                        <span className="block font-semibold text-gray-900">{m.name}</span>
                        <span className="block text-sm text-gray-600">{t(m.role)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-gray-50 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.faq.title')}</h2>
            <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <details key={n} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                    {t(`landing.faq.q${n}`)}
                    <ChevronDownIcon className="h-5 w-5 flex-shrink-0 text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-base text-gray-600">{t(`landing.faq.a${n}`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.contact.title')}</h2>
              <p className="mt-4 text-lg text-gray-600">{t('landing.contact.subtitle')}</p>
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-2">
                <div className="flex gap-4">
                  <PhoneIcon className="mt-1 h-6 w-6 flex-shrink-0 text-primary-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('landing.contact.phone')}</h3>
                    <ul className="mt-1 space-y-1">
                      {PHONES.map((p) => (
                        <li key={p}>
                          <a href={`tel:${p}`} dir="ltr" className="inline-block rounded text-gray-700 hover:text-primary-700 hover:underline">
                            {p}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-4">
                  <EnvelopeIcon className="mt-1 h-6 w-6 flex-shrink-0 text-primary-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('landing.contact.email')}</h3>
                    <a href={`mailto:${EMAIL}`} className="mt-1 inline-block text-gray-700 hover:text-primary-700 hover:underline">
                      {EMAIL}
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPinIcon className="mt-1 h-6 w-6 flex-shrink-0 text-primary-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('landing.contact.address')}</h3>
                    <p className="mt-1 text-gray-700">{t('landing.contact.addressValue')}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
                {/* Honeypot: hidden from people, bots fill it in */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input type="text" name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-gray-700">{t('landing.contact.form.name')}</label>
                    <input id="c-name" name="name" type="text" autoComplete="name" required value={form.name} onChange={onChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="mb-1 block text-sm font-medium text-gray-700">{t('landing.contact.form.email')}</label>
                    <input id="c-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={onChange} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-phone" className="mb-1 block text-sm font-medium text-gray-700">{t('landing.contact.form.phone')}</label>
                  <input id="c-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={onChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="c-message" className="mb-1 block text-sm font-medium text-gray-700">{t('landing.contact.form.message')}</label>
                  <textarea id="c-message" name="message" rows={5} required value={form.message} onChange={onChange} className={inputClass} />
                </div>

                <div aria-live="polite">
                  {status.state === 'sent' && (
                    <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{status.message}</p>
                  )}
                  {status.state === 'error' && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{status.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status.state === 'sending'}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-primary-700 px-8 py-3 text-base font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
                >
                  {status.state === 'sending' ? t('landing.contact.form.sending') : t('landing.contact.form.send')}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-primary-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-sm">{t('landing.footer.rights', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/login" className="hover:text-white hover:underline">{t('landing.footer.portal')}</Link>
            <a href="#contact" className="hover:text-white hover:underline">{t('landing.nav.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
