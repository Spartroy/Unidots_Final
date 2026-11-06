import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Field, Select } from '../../design/controls';
import { Button, DefList, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';
import { AttachmentList, FilePicker } from '../../components/claims/ClaimBits';
import { TaskBadge, TaskPriority } from './TasksList';

const STATUSES = ['Pending', 'In Progress', 'On Hold'];
const TASK_FILES = { 'image/jpeg': [], 'image/png': [], 'application/pdf': [], 'application/postscript': ['.eps', '.ai'], 'application/zip': ['.zip'] };

// One task: what to do, who has it, progress, files and the discussion.
const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();
  const isManager = user.role === 'manager' || user.role === 'admin';
  const base = `/${user.role}/tasks`;

  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [picked, setPicked] = useState([]);
  const [staff, setStaff] = useState([]);
  const [who, setWho] = useState('');
  const [status, setStatus] = useState('Pending');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [doneNotes, setDoneNotes] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const actions = useMemo(() => <Link to={base} className="ud-btn ud-btn-secondary">{t('tk.d.back')}</Link>, [base, t]);
  usePageChrome({ title: task?.title, subtitle: t('tk.subtitle.detail'), actions });

  const load = useCallback(async () => {
    try {
      const [r, f] = await Promise.all([api.get(`/api/tasks/${id}`), api.get(`/api/tasks/${id}/files`).catch(() => ({ data: [] }))]);
      setTask(r.data);
      setFiles(Array.isArray(f.data) ? f.data : []);
      setStatus(r.data.status);
      setProgress(r.data.progress || 0);
      setNotes(r.data.notes || '');
      setWho(r.data.assignedTo?._id || '');
      setError(null);
    } catch (e) {
      setError(e.response?.status === 404 ? t('tk.d.notFound') : e.response?.data?.message || t('tk.d.loadError'));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (isManager) api.get('/api/users?role=employee&isActive=true&limit=100').then((r) => setStaff(r.data.users || [])).catch(() => {});
  }, [isManager]);

  const run = async (fn, ok, fail) => {
    try {
      setBusy(true);
      await fn();
      if (ok) toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || fail);
    } finally {
      setBusy(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    return run(() => api.put(`/api/tasks/${id}`, { status, progress: Number(progress), notes }), t('tk.d.saved'), t('tk.d.saveFailed'));
  };
  const complete = () => run(() => api.put(`/api/tasks/${id}/complete`, { completionNotes: doneNotes }), t('tk.d.completeDone'), t('tk.d.saveFailed'));
  const reassign = () => run(() => api.put(`/api/tasks/${id}/assign`, { assignedTo: who, employeeId: who }), t('tk.d.reassigned'), t('tk.d.saveFailed'));
  const send = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    return run(async () => { await api.post(`/api/tasks/${id}/comments`, { content: comment.trim() }); setComment(''); }, null, t('tk.d.commentFailed'));
  };
  const upload = () =>
    run(async () => {
      const fd = new FormData();
      picked.forEach((f) => fd.append('files', f));
      fd.append('taskId', id);
      await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPicked([]);
    }, t('tk.d.uploaded'), t('tk.d.uploadFailed'));
  const remove = async () => {
    try {
      setBusy(true);
      await api.delete(`/api/tasks/${id}`);
      toast.success(t('tk.d.deleted'));
      navigate(base);
    } catch (e) {
      toast.error(e.response?.data?.message || t('tk.d.saveFailed'));
      setBusy(false);
    }
  };

  if (error && !task) return <Notice tone="error">{error}</Notice>;
  if (!task) return <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>;

  const date = (d, time) => (d ? new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : '—');
  const closed = ['Completed', 'Cancelled'].includes(task.status);
  const mine = task.assignedTo?._id === (user._id || user.id);

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 900 }} dir={dir}>
      <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <TaskBadge status={task.status} />
          <TaskPriority level={task.priority} />
        </div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{task.description}</p>
        <DefList
          dir={dir}
          items={[
            [t('tk.d.assignee'), task.assignedTo?.name || '—'],
            [t('tk.d.createdBy'), task.createdBy?.name || '—'],
            [t('tk.d.type'), t(`tk.type.${task.taskType}`)],
            [t('tk.d.due'), date(task.dueDate)],
            [t('tk.d.order'), task.relatedOrder ? <Link className="ud-link" to={`/${user.role}/orders/${task.relatedOrder._id}`}>{task.relatedOrder.orderNumber}</Link> : t('tk.d.none')],
            [t('tk.d.created'), date(task.createdAt, true)],
            task.completedAt ? [t('tk.d.completedAt'), date(task.completedAt, true)] : null,
          ].filter(Boolean)}
        />
        {task.completionNotes && <Notice tone="success">{task.completionNotes}</Notice>}
      </section>

      {!closed && (isManager || mine) && (
        <section className="ud-card ud-rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="ud-card-h">{t('tk.d.update')}</h2>
          <form onSubmit={save} noValidate style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Select label={t('tk.d.status')} value={status} onChange={(e) => setStatus(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: t(`tk.status.${s}`) }))} />
              <Field label={t('tk.d.progress')} type="number" dir="ltr" min={0} max={100} value={progress} onChange={(e) => setProgress(Math.max(0, Math.min(100, e.target.value)))} />
            </div>
            <Field label={t('tk.d.notes')} multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div><Button type="submit" disabled={busy}>{t('tk.d.save')}</Button></div>
          </form>
          {mine && (
            <>
              <Field label={t('tk.d.completionNotes')} multiline rows={2} value={doneNotes} onChange={(e) => setDoneNotes(e.target.value)} />
              <div><Button variant="secondary" onClick={complete} disabled={busy}>{t('tk.d.complete')}</Button></div>
            </>
          )}
          {isManager && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <Select label={t('tk.form.assignee')} value={who} onChange={(e) => setWho(e.target.value)} options={staff.map((u) => ({ value: u._id, label: u.name }))} />
              </div>
              <Button variant="secondary" onClick={reassign} disabled={busy || !who || who === (task.assignedTo?._id || '')}>{t('tk.d.reassign')}</Button>
            </div>
          )}
        </section>
      )}

      <section className="ud-card ud-rise" style={{ '--i': 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="ud-card-h">{t('tk.d.files')}</h2>
        {files.length === 0 ? <p className="ud-card-s">{t('tk.d.noFiles')}</p> : <AttachmentList files={files} />}
        {!closed && (
          <>
            <FilePicker files={picked} onChange={setPicked} disabled={busy} accept={TASK_FILES} maxBytes={50 * 1024 * 1024} hint={t('tk.d.addFiles')} label={t('tk.d.addFiles')} />
            {picked.length > 0 && <div><Button onClick={upload} disabled={busy}>{busy ? t('tk.d.uploading') : t('tk.d.upload')}</Button></div>}
          </>
        )}
      </section>

      <section className="ud-card ud-rise" style={{ '--i': 3, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="ud-card-h">{t('tk.d.discussion')}</h2>
        {(task.comments || []).length === 0 ? (
          <p className="ud-card-s">{t('tk.d.noComments')}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {task.comments.map((c, i) => (
              <li key={c._id || i} style={{ borderBlockEnd: '1px solid var(--border)', paddingBlockEnd: 12 }}>
                <b>{c.author?.name || '—'}</b> <span className="ud-hint">{date(c.createdAt, true)}</span>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.content}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={send} style={{ display: 'grid', gap: 8 }}>
          <Field label={t('tk.d.comment')} multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          <div><Button type="submit" disabled={busy || !comment.trim()}>{t('tk.d.send')}</Button></div>
        </form>
      </section>

      {isManager && (
        <div><Button variant="secondary" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(true)}>{t('tk.d.delete')}</Button></div>
      )}
      {confirmDelete && (
        <Modal
          destructive
          title={t('tk.d.deleteTitle')}
          onClose={() => setConfirmDelete(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t('tk.d.keep')}</Button>
              <Button variant="danger" disabled={busy} onClick={remove}>{t('tk.d.delete')}</Button>
            </>
          }
        >
          <p>{t('tk.d.deleteText')}</p>
        </Modal>
      )}
    </div>
  );
};

export default TaskDetail;
