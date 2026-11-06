import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { SearchField } from '../../design/controls';
import { EmptyState, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';

const IMAGES = { 'Rice Package': 'Rice', 'Juice Pouch': 'Juice', 'Coffee Package': 'Coffee', 'Tea Package': 'Tea' };

// Designer: ready-made templates to start a design from.
const Templates = () => {
  const { t, dir } = useLanguage();
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  usePageChrome({ subtitle: t('tp.subtitle') });

  useEffect(() => {
    api.get('/api/templates')
      .then((r) => setTemplates(r.data.templates || []))
      .catch((e) => setError(e.response?.data?.message || t('tp.loadError')));
  }, [t]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (templates || []).filter((x) => !q || [x.name, x.category, x.subCategory].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [templates, search]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!templates) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;

  return (
    <>
      <div style={{ maxWidth: 420 }}>
        <SearchField dir={dir} label={t('tp.search')} placeholder={t('tp.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {shown.length === 0 ? (
        <EmptyState dir={dir} title={search ? t('tp.emptyMatch') : t('tp.empty')} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }} dir={dir}>
          {shown.map((x, i) => {
            const img = x.previewImage?.fileUrl || (IMAGES[x.subCategory] ? `/images/templates/${IMAGES[x.subCategory]}.png` : null);
            return (
              <li key={x._id} className="ud-card ud-rise" style={{ '--i': Math.min(i, 8), padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '4 / 3', background: 'var(--bg-app)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                  {img ? <img src={img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>{x.subCategory || x.category}</span>}
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h2 className="ud-card-h">{x.name}</h2>
                  <p className="ud-card-s">{[x.category, x.subCategory].filter(Boolean).join(' · ')}{x.difficulty ? ` · ${t(`tp.difficulty.${x.difficulty}`)}` : ''}</p>
                  <Link to={`/employee/templates/${x._id}/customize`} className="ud-btn ud-btn-primary" style={{ marginBlockStart: 'auto' }}>{t('tp.use')}</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default Templates;
