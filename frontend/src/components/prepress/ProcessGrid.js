import React from 'react';
import { Shape, Check, Button } from '../../design/kit';
import { useLanguage } from '../../context/LanguageContext';

export const PROCESS_KEYS = ['positioning', 'backExposure', 'laserImaging', 'mainExposure', 'washout', 'drying', 'postExposure', 'uvcExposure', 'finishing'];

// The nine plate processes as large cards. The first pending one gets the single primary button;
// other pending ones are secondary; finished ones show who and when, with a quiet "redo".
const ProcessGrid = ({ subProcesses = {}, canEdit, busy, onChange }) => {
  const { t, lang, dir } = useLanguage();
  const time = (d) => (d ? new Date(d).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '');
  let primaryTaken = false;

  return (
    <ul className="ud-procgrid ud-root" dir={dir}>
      {PROCESS_KEYS.map((key) => {
        const p = subProcesses[key] || {};
        const done = p.status === 'Completed';
        const isNext = !done && !primaryTaken;
        if (isNext) primaryTaken = true;
        const who = p.completedBy?.name;
        const label = t(`process.${key}`);
        return (
          <li key={key} className="ud-proc" data-done={done ? 'true' : 'false'}>
            <div className="ud-proc-top">
              <b>{label}</b>
              <span
                className="ud-badge"
                style={
                  done
                    ? { background: 'var(--status-completed-bg)', color: 'var(--status-completed-fg)' }
                    : { background: 'var(--bg-app)', color: 'var(--text-muted)', border: '1px solid var(--border-control)' }
                }
              >
                <Shape shape={done ? 'check' : 'circle'} />
                {done ? t('px.d.done') : t('px.d.waiting')}
              </span>
            </div>
            <span className="ud-check-meta">{done ? [time(p.completedAt), who].filter(Boolean).join(' · ') : t('px.d.pending')}</span>
            {canEdit && (
              <Button
                variant={done ? 'ghost' : isNext ? 'primary' : 'secondary'}
                size="lg"
                style={{ width: '100%' }}
                disabled={busy}
                aria-label={`${done ? t('px.d.redo') : t('px.d.complete')}: ${label}`}
                onClick={() => onChange(key, done ? 'Pending' : 'Completed')}
              >
                {!done && isNext ? <Check size={22} /> : null}
                {done ? t('px.d.redo') : t('px.d.complete')}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ProcessGrid;
