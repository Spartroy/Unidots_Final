import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Button, StatusBadge } from '../../design/kit';
import { Field } from '../../design/controls';
import { openFile } from '../../utils/files';

const KEY = { Submitted: 'submitted', 'Under Review': 'awaiting-approval', 'In Progress': 'in-prepress', Resolved: 'completed', Rejected: 'cancelled', Closed: 'on-hold' };
export const MAX_BYTES = 10 * 1024 * 1024;
export const OPEN_STATUSES = ['Submitted', 'Under Review', 'In Progress'];

export const ClaimBadge = ({ status }) => {
  const { t } = useLanguage();
  return <StatusBadge status={KEY[status] || 'submitted'} label={t(`cl.status.${status}`) === `cl.status.${status}` ? status : t(`cl.status.${status}`)} />;
};

export const useDate = () => {
  const { lang } = useLanguage();
  return (d, time) => (d ? new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : '—');
};

const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// Drop zone + list of chosen files. The parent owns the array of File objects.
export const FilePicker = ({ files, onChange, disabled }) => {
  const { t, dir } = useLanguage();
  const onDrop = useCallback(
    (accepted, rejected) => {
      rejected.forEach((r) => toast.warn(t('cl.drop.rejected', { name: r.file.name })));
      if (accepted.length) onChange([...files, ...accepted]);
    },
    [files, onChange, t]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize: MAX_BYTES,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
  });
  return (
    <div dir={dir}>
      <div {...getRootProps({ className: 'ud-drop', style: isDragActive ? { borderColor: 'var(--accent)', background: 'var(--bg-app)' } : undefined })}>
        <input {...getInputProps()} aria-label={t('cl.form.files')} />
        <strong>{isDragActive ? t('cl.drop.active') : t('cl.drop.title')}</strong>
        <span>{t('cl.form.filesHint')}</span>
        <span className="ud-btn ud-btn-secondary" aria-hidden="true">{t('cl.drop.browse')}</span>
      </div>
      {files.length > 0 && (
        <ul className="ud-files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="ud-file">
              <span className="ud-file-ph">{(f.name.split('.').pop() || 'file').slice(0, 4).toUpperCase()}</span>
              <span className="ud-file-name">{f.name}</span>
              <span className="ud-file-size">{size(f.size)}</span>
              <button type="button" className="ud-btn ud-btn-ghost" disabled={disabled} aria-label={t('cl.drop.remove', { name: f.name })} onClick={() => onChange(files.filter((_, j) => j !== i))}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Upload files one by one. Returns { ids, failed } so the caller can decide what to tell the person.
export const uploadFiles = async (files, extra = {}) => {
  const ids = [];
  const failed = [];
  for (const file of files) {
    const body = new FormData();
    body.append('file', file);
    Object.entries(extra).forEach(([k, v]) => v && body.append(k, v));
    try {
      const r = await api.post('/api/files', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      ids.push(r.data._id);
    } catch (e) {
      failed.push(file.name);
    }
  }
  return { ids, failed };
};

export const AttachmentList = ({ files }) => {
  const { t } = useLanguage();
  const date = useDate();
  if (!files || files.length === 0) return <p className="ud-card-s">{t('cl.detail.noFiles')}</p>;
  return (
    <ul className="ud-files" style={{ margin: 0 }}>
      {files.map((f) => (
        <li key={f._id} className="ud-file">
          <span className="ud-file-ph">{((f.originalname || f.filename || 'file').split('.').pop() || 'file').slice(0, 4).toUpperCase()}</span>
          <span className="ud-file-name">
            {f.originalname || f.filename}
            {f.uploadedBy?.name && <span className="ud-hint" style={{ display: 'block' }}>{f.uploadedBy.name} · {date(f.createdAt)}</span>}
          </span>
          <button type="button" className="ud-btn ud-btn-secondary" onClick={(e) => openFile(e, f._id)}>{t('cl.detail.download')}</button>
        </li>
      ))}
    </ul>
  );
};

// Messages on a claim: everyone involved sees the same thread.
export const ClaimThread = ({ claimId, comments = [], currentUserId, onSent }) => {
  const { t, dir } = useLanguage();
  const date = useDate();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setBusy(true);
      await api.post(`/api/claims/${claimId}/comments`, { content: text.trim() });
      setText('');
      onSent && onSent();
    } catch (err) {
      toast.error(err.response?.data?.message || t('cl.msg.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ud-card ud-rise" dir={dir} aria-labelledby="thread-h" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id="thread-h" className="ud-card-h">{t('cl.msg.title')}</h2>
      {comments.length === 0 ? (
        <p className="ud-card-s">{t('cl.msg.empty')}</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map((c, i) => {
            const mine = c.author?._id === currentUserId || c.author === currentUserId;
            return (
              <li key={c._id || i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: 'min(560px, 92%)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', background: mine ? 'var(--primary)' : 'var(--bg-app)', color: mine ? 'var(--on-primary)' : 'var(--text)', border: mine ? 0 : '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{mine ? t('cl.msg.you') : c.author?.name || '—'} · {date(c.createdAt, true)}</div>
                <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.content}</div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label={t('cl.msg.label')} multiline rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div><Button type="submit" disabled={busy || !text.trim()}>{busy ? t('cl.msg.sending') : t('cl.msg.send')}</Button></div>
      </form>
    </section>
  );
};
