import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips, Field, Pager, SearchField, Select } from '../../design/controls';
import { Button, DataTable, EmptyState, Notice, PriorityBadge, StatusBadge } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';

const PAGE = 10;
const STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold'];
const KEY = { Pending: 'submitted', 'In Progress': 'in-prepress', Completed: 'completed', 'On Hold': 'on-hold', Cancelled: 'cancelled' };
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const TYPES = ['General', 'Design', 'Prepress', 'Production', 'Quality Check'];

export const TaskBadge = ({ status }) => {
  const { t } = useLanguage();
  return <StatusBadge status={KEY[status] || 'submitted'} label={t(`tk.status.${status}`)} />;
};
export const TaskPriority = ({ level }) => {
  const { t } = useLanguage();
  return <PriorityBadge level={String(level || 'Medium').toLowerCase()} label={t(`tk.priority.${level || 'Medium'}`)} />;
};

const NewTask = ({ onClose, onDone }) => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [f, setF] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', taskType: 'General', dueDate: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get('/api/users?role=employee&isActive=true&limit=100').then((r) => setStaff(r.data.users || [])).catch(() => {});
  }, []);
  const set = (e) => {
    setF((x) => ({ ...x, [e.target.name]: e.target.value }));
    setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = t('tk.form.err.title');
    if (!f.description.trim()) er.description = t('tk.form.err.description');
    if (!f.assignedTo) er.assignedTo = t('tk.form.err.assignee');
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      setBusy(true);
      await api.post('/api/tasks', { ...f, title: f.title.trim(), description: f.description.trim(), dueDate: f.dueDate || undefined });
      toast.success(t('tk.form.created'));
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || t('tk.form.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t('tk.new')}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>{t('tk.form.cancel')}</Button>
          <Button type="submit" form="new-task" disabled={busy}>{t('tk.form.create')}</Button>
        </>
      }
    >
      <form id="new-task" onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <Field label={t('tk.form.title')} name="title" value={f.title} onChange={set} error={errors.title} required maxLength={120} />
        <Field label={t('tk.form.description')} name="description" multiline rows={3} value={f.description} onChange={set} error={errors.description} required />
        <Select label={t('tk.form.assignee')} name="assignedTo" value={f.assignedTo} onChange={set} options={[{ value: '', label: t('tk.form.assigneePick') }, ...staff.map((u) => ({ value: u._id, label: u.name }))]} />
        {errors.assignedTo && <span className="ud-error" role="alert">{errors.assignedTo}</span>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <Select label={t('tk.form.priority')} name="priority" value={f.priority} onChange={set} options={PRIORITIES.map((p) => ({ value: p, label: t(`tk.priority.${p}`) }))} />
          <Select label={t('tk.form.type')} name="taskType" value={f.taskType} onChange={set} options={TYPES.map((p) => ({ value: p, label: t(`tk.type.${p}`) }))} />
          <Field label={t('tk.form.due')} name="dueDate" type="date" dir="ltr" value={f.dueDate} onChange={set} />
        </div>
      </form>
    </Modal>
  );
};

// Tasks: the manager sees everyone's, a designer sees their own.
const TasksList = () => {
  const { user } = useContext(AuthContext);
  const { t, lang, dir } = useLanguage();
  const isManager = user.role === 'manager' || user.role === 'admin';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const actions = useMemo(() => (isManager ? <Button onClick={() => setAdding(true)}>{t('tk.new')}</Button> : null), [isManager, t]);
  usePageChrome({ subtitle: t(isManager ? 'tk.subtitle.manager' : 'tk.subtitle.employee'), actions });

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [filter]);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE) });
      if (filter !== 'all') p.set('status', filter);
      if (query) p.set('search', query);
      const r = await api.get(`/api/tasks?${p.toString()}`);
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('tk.loadError'));
    }
  }, [page, filter, query, t]);
  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const tasks = data?.tasks || [];
  const fmt = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const overdue = (k) => k.dueDate && !['Completed', 'Cancelled'].includes(k.status) && new Date(k.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  const rows = tasks.map((k) => ({
    n: <Link className="ud-link" to={`/${user.role}/tasks/${k._id}`}>{k.title}</Link>,
    a: k.assignedTo?.name || '—',
    p: <TaskPriority level={k.priority} />,
    s: <TaskBadge status={k.status} />,
    d: k.dueDate ? <span>{fmt(k.dueDate)}{overdue(k) && <span style={{ display: 'block', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>{t('tk.overdue')}</span>}</span> : '—',
    g: <bdi dir="ltr">{k.progress || 0}%</bdi>,
  }));

  return (
    <>
      <Chips dir={dir} label={t('nav.tasks')} value={filter} onChange={setFilter} items={['all', ...STATUSES].map((k) => ({ key: k, label: t(`tk.filter.${k}`) }))} />
      <div style={{ maxWidth: 420 }}>
        <SearchField dir={dir} label={t('tk.search')} placeholder={t('tk.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={300} /></div>}
      {data && tasks.length === 0 && (
        <EmptyState dir={dir} title={t('tk.empty')} action={isManager ? <Button onClick={() => setAdding(true)}>{t('tk.new')}</Button> : null}>
          {t(isManager ? 'tk.emptyManager' : 'tk.emptyEmployee')}
        </EmptyState>
      )}
      {data && tasks.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t('nav.tasks')}
            columns={[
              { key: 'n', label: t('tk.col.task') },
              ...(isManager ? [{ key: 'a', label: t('tk.col.assignee') }] : []),
              { key: 'p', label: t('tk.col.priority') },
              { key: 's', label: t('tk.col.status') },
              { key: 'd', label: t('tk.col.due') },
              { key: 'g', label: t('tk.col.progress') },
            ]}
            rows={rows}
          />
        </div>
      )}
      {data && data.total > PAGE && <Pager dir={dir} page={page} pages={data.pages || 1} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE + 1, to: Math.min(page * PAGE, data.total), total: data.total })} />}

      {adding && <NewTask onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
};

export default TasksList;
