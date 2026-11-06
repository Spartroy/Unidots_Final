import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

// What happened on an order, trimmed by the server to what the signed-in role may see.
const OrderTimeline = ({ orderId, refreshKey }) => {
  const { t, lang, dir } = useLanguage();
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/orders/${orderId}/timeline`)
      .then((r) => alive && (setEntries(r.data.entries), setFailed(false)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [orderId, refreshKey]);

  if (failed) return null; // the rest of the page already explains access problems
  if (!entries) return null;

  const when = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section className="ud-card ud-root" dir={dir} aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="ud-card-h">{t('timeline.title')}</h2>
      {entries.length === 0 ? (
        <p className="ud-card-s">{t('timeline.empty')}</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[...entries].reverse().map((e, i) => (
            <li key={i} className="ud-rise" style={{ '--i': Math.min(i, 8), display: 'flex', gap: 12, paddingBlock: 10, borderBlockStart: i ? '1px solid var(--border)' : 0 }}>
              <span aria-hidden="true" style={{ flex: 'none', width: 10, height: 10, borderRadius: 9999, marginBlockStart: 7, background: e.outcome === 'denied' ? 'var(--danger)' : 'var(--accent)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  {e.action}
                  {e.actor?.name ? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> {t('timeline.by', { name: e.actor.name })}</span> : null}
                </div>
                {e.details ? <div style={{ color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{e.details}</div> : null}
                <div className="ud-hint">{when(e.at)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default OrderTimeline;
