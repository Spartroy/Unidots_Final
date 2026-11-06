import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Chips, Field, Pager, SearchField } from '../../design/controls';
import { Button, DataTable, EmptyState, Notice, StatusBadge } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import Modal from '../../components/common/Modal';

const PAGE = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF = ['employee', 'prepress', 'courier'];

export const ActiveBadge = ({ active }) => {
  const { t } = useLanguage();
  return <StatusBadge status={active ? 'completed' : 'cancelled'} label={t(active ? 'pp.active' : 'pp.inactive')} />;
};

// Create a staff account. The server decides what each role may do; managers only.
const AddPerson = ({ role, onClose, onDone }) => {
  const { t } = useLanguage();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (e) => {
    setF((x) => ({ ...x, [e.target.name]: e.target.value }));
    setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = t('pp.add.err.name');
    if (!EMAIL.test(f.email.trim())) er.email = t('pp.add.err.email');
    if (f.password.length < 8) er.password = t('pp.add.err.password');
    setErrors(er);
    if (Object.keys(er).length) return;
    const body = { name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone };
    try {
      setBusy(true);
      if (role === 'employee') await api.post('/api/users/employees', { ...body, department: 'design' });
      else if (role === 'courier') await api.post('/api/users/couriers', body);
      else await api.post('/api/auth/register', { ...body, role: 'prepress', department: 'prepress' });
      toast.success(t('pp.add.done'));
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || t('pp.add.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t('pp.add.title', { role: t(`pp.roleOne.${role}`) })}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>{t('pp.add.cancel')}</Button>
          <Button type="submit" form="add-person" disabled={busy}>{t('pp.add.submit')}</Button>
        </>
      }
    >
      <form id="add-person" onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <Field label={t('pp.add.name')} name="name" value={f.name} onChange={set} error={errors.name} required autoComplete="off" />
        <Field label={t('pp.add.email')} name="email" type="email" dir="ltr" value={f.email} onChange={set} error={errors.email} required autoComplete="off" />
        <Field label={t('pp.add.password')} hint={t('pp.add.passwordHint')} name="password" type="text" dir="ltr" value={f.password} onChange={set} error={errors.password} required autoComplete="new-password" />
        <Field label={t('pp.add.phone')} name="phone" type="tel" dir="ltr" value={f.phone} onChange={set} />
      </form>
    </Modal>
  );
};

// Manager: clients or staff, searchable, with account status at a glance.
const People = ({ kind }) => {
  const isStaff = kind === 'staff';
  const { t, lang, dir } = useLanguage();
  const [role, setRole] = useState('employee');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const actions = useMemo(() => (isStaff ? <Button onClick={() => setAdding(true)}>{t('pp.add')}</Button> : null), [isStaff, t]);
  usePageChrome({ subtitle: t(isStaff ? 'pp.subtitle.staff' : 'pp.subtitle.clients'), actions });

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [role, filter]);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ role: isStaff ? role : 'client', page: String(page), limit: String(PAGE) });
      if (filter !== 'all') p.set('isActive', String(filter === 'active'));
      if (query) p.set('search', query);
      const r = await api.get(`/api/users?${p.toString()}`);
      setData(r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('pp.loadError'));
    }
  }, [isStaff, role, filter, query, page, t]);
  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const base = isStaff ? '/manager/employees' : '/manager/clients';
  const users = data?.users || [];
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const rows = users.map((u) => ({
    n: <Link className="ud-link" to={`${base}/${u._id}`}>{u.name}</Link>,
    e: <bdi dir="ltr">{u.email}</bdi>,
    p: u.phone ? <bdi dir="ltr">{u.phone}</bdi> : '—',
    c: u.company || '—',
    s: <ActiveBadge active={u.isActive !== false} />,
    j: fmt(u.createdAt),
  }));

  return (
    <>
      {isStaff && <Chips dir={dir} label={t('nav.employees')} value={role} onChange={setRole} items={STAFF.map((k) => ({ key: k, label: t(`pp.role.${k}`) }))} />}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }} dir={dir}>
        <div style={{ flex: '1 1 300px', minWidth: 240 }}>
          <SearchField dir={dir} label={t('pp.search')} placeholder={t('pp.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Chips dir={dir} label={t('pp.col.status')} value={filter} onChange={setFilter} items={['all', 'active', 'inactive'].map((k) => ({ key: k, label: t(`pp.filter.${k}`) }))} />
      </div>

      {error && !data && <Notice tone="error">{error}</Notice>}
      {!data && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={320} /></div>}
      {data && users.length === 0 && <EmptyState dir={dir} title={query ? t('pp.emptyMatch') : t('pp.empty')} />}
      {data && users.length > 0 && (
        <div className="ud-card ud-pad0 ud-rise">
          <DataTable
            dir={dir}
            caption={t(isStaff ? 'nav.employees' : 'nav.clients')}
            columns={[
              { key: 'n', label: t('pp.col.name') },
              { key: 'e', label: t('pp.col.email') },
              { key: 'p', label: t('pp.col.phone') },
              ...(isStaff ? [] : [{ key: 'c', label: t('pp.col.company') }]),
              { key: 's', label: t('pp.col.status') },
              { key: 'j', label: t('pp.col.joined') },
            ]}
            rows={rows}
          />
        </div>
      )}
      {data && data.total > PAGE && <Pager dir={dir} page={page} pages={data.pages || 1} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE + 1, to: Math.min(page * PAGE, data.total), total: data.total })} />}

      {adding && <AddPerson role={role} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
};

export default People;
