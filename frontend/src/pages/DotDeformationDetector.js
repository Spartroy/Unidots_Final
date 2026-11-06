import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button, Notice } from '../design/kit';
import usePageTitle from '../utils/usePageTitle';

// Set REACT_APP_AI_URL in production; falls back to the local AI service for development.
const AI_API_URL = (process.env.REACT_APP_AI_URL || 'http://localhost:8000').replace(/\/+$/, '');
const HOME = { client: '/client', employee: '/employee', manager: '/manager', admin: '/manager', prepress: '/prepress', courier: '/courier' };

// Check a photo of a dot pattern with the AI service.
const DotDeformationDetector = () => {
  const { user } = useContext(AuthContext);
  const { t, lang, setLang, dir } = useLanguage();
  usePageTitle(`${t('dd.title')} | UniDots`);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [preview, setPreview] = useState(null);
  const input = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error(t('dd.notImage'));
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setLoading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const r = await fetch(`${AI_API_URL}/predict`, { method: 'POST', body });
      if (!r.ok) throw new Error(r.statusText);
      setPrediction(await r.json());
    } catch (err) {
      toast.error(t('dd.failed'));
    } finally {
      setLoading(false);
    }
  };

  const good = prediction?.class === 'good' || prediction?.prediction === 'good' || prediction?.class_name === 'good';
  const conf = prediction ? Number(prediction.confidence) * 100 : 0;
  const num = (v, d = 1) => Number(v).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: d });

  return (
    <div className="ud-root" dir={dir} style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text)' }}>
      <header style={{ background: 'var(--bg-card)', borderBlockEnd: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, font: '700 28px/36px var(--font-sans)' }}>{t('dd.title')}</h1>
            <p className="ud-card-s" style={{ margin: 0 }}>{t('dd.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="ud-lang" role="group" aria-label="Language / اللغة" style={{ borderColor: 'var(--border-control)' }}>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} style={{ color: lang === 'en' ? undefined : 'var(--text)' }}>EN</button>
              <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} style={{ color: lang === 'ar' ? undefined : 'var(--text)' }}>عربي</button>
            </div>
            <Link className="ud-btn ud-btn-secondary" to={user ? HOME[user.role] || '/' : '/'}>{user ? t('dd.dashboard') : t('dd.home')}</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16, display: 'grid', gap: 16 }}>
        <div className="ud-grid ud-grid-2" style={{ alignItems: 'start' }}>
          <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="ud-card-h">{t('dd.upload')}</h2>
            <input ref={input} id="dd-file" type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
            <label htmlFor="dd-file" className="ud-drop" style={{ cursor: 'pointer' }}>
              <strong>{preview ? t('dd.change') : t('dd.choose')}</strong>
              <span>{t('dd.hint')}</span>
            </label>
            {preview && (
              <figure style={{ margin: 0 }}>
                <figcaption className="ud-label">{t('dd.uploaded')}</figcaption>
                <img src={preview} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-app)' }} />
              </figure>
            )}
          </section>

          <section className="ud-card ud-rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
            <h2 className="ud-card-h">{t('dd.results')}</h2>
            {loading && (
              <div role="status">
                <strong>{t('dd.analyzing')}</strong>
                <p className="ud-card-s" style={{ margin: 0 }}>{t('dd.analyzingHint')}</p>
              </div>
            )}
            {!loading && !prediction && (
              <div>
                <strong>{t('dd.idle')}</strong>
                <p className="ud-card-s" style={{ margin: 0 }}>{t('dd.idleHint')}</p>
              </div>
            )}
            {!loading && prediction && (
              <>
                <Notice tone={good ? 'success' : 'error'}>{good ? t('dd.good') : t('dd.bad')}</Notice>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('dd.confidence')}</span>
                    <b dir="ltr">{num(conf)}%</b>
                  </div>
                  <div className="ud-progress" role="progressbar" aria-valuenow={Math.round(conf)} aria-valuemin={0} aria-valuemax={100} aria-label={t('dd.confidence')}>
                    <span style={{ width: `${Math.min(100, conf)}%`, background: good ? 'var(--status-completed-fg)' : 'var(--danger)' }} />
                  </div>
                </div>
                {prediction.raw_probability !== undefined && (
                  <p className="ud-hint" style={{ margin: 0 }}>{t('dd.raw')}: <bdi dir="ltr">{num(prediction.raw_probability, 4)}</bdi></p>
                )}
                <div><Button variant="secondary" onClick={() => input.current?.click()}>{t('dd.change')}</Button></div>
              </>
            )}
          </section>
        </div>

        <div className="ud-grid ud-grid-2">
          <section className="ud-card">
            <h2 className="ud-card-h">{t('dd.how')}</h2>
            <ol style={{ margin: '8px 0 0', paddingInlineStart: 20, display: 'grid', gap: 4 }}><li>{t('dd.how1')}</li><li>{t('dd.how2')}</li><li>{t('dd.how3')}</li></ol>
          </section>
          <section className="ud-card">
            <h2 className="ud-card-h">{t('dd.tips')}</h2>
            <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, display: 'grid', gap: 4 }}><li>{t('dd.tip1')}</li><li>{t('dd.tip2')}</li><li>{t('dd.tip3')}</li></ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DotDeformationDetector;
