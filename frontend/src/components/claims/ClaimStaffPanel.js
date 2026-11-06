import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../design/kit';
import { Field, Select } from '../../design/controls';

const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Closed'];
const ACTIONS = ['Reprint', 'Refund', 'Discount', 'Replacement', 'No Action', 'Other'];

// Staff only: change the status, record the resolution and (managers) assign a designer.
const ClaimStaffPanel = ({ claim, role, onChanged }) => {
  const { t, dir } = useLanguage();
  const [status, setStatus] = useState(claim.status);
  const [action, setAction] = useState(claim.resolution?.action || '');
  const [details, setDetails] = useState(claim.resolution?.details || '');
  const [staff, setStaff] = useState([]);
  const [who, setWho] = useState(claim.assignedTo?._id || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role === 'manager') api.get('/api/users?role=employee&isActive=true&limit=100').then((r) => setStaff(r.data.users || [])).catch(() => {});
  }, [role]);

  const save = async (e) => {
    e.preventDefault();
    if (['Resolved', 'Rejected'].includes(status) && !details.trim()) return toast.error(t('cl.staff.needResolution'));
    try {
      setBusy(true);
      await api.put(`/api/claims/${claim._id}/status`, {
        status,
        ...(details.trim() ? { resolution: { action: action || 'Other', details: details.trim() } } : {}),
      });
      toast.success(t('cl.staff.saved'));
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || t('cl.staff.failed'));
    } finally {
      setBusy(false);
    }
  };

  const assign = async () => {
    try {
      setBusy(true);
      await api.put(`/api/claims/${claim._id}/assign`, { employeeId: who });
      toast.success(t('cl.staff.assigned'));
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || t('cl.staff.assignFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ud-card ud-rise" dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 className="ud-card-h">{t('cl.staff.title')}</h2>
      {role === 'manager' && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Select label={t('cl.staff.assign')} value={who} onChange={(e) => setWho(e.target.value)} options={[{ value: '', label: t('cl.detail.unassigned') }, ...staff.map((u) => ({ value: u._id, label: u.name }))]} />
          </div>
          <Button variant="secondary" onClick={assign} disabled={busy || !who || who === (claim.assignedTo?._id || '')}>{t('cl.staff.assignBtn')}</Button>
        </div>
      )}
      <form onSubmit={save} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Select label={t('cl.staff.status')} value={status} onChange={(e) => setStatus(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: t(`cl.status.${s}`) }))} />
          <Select label={t('cl.staff.action')} value={action} onChange={(e) => setAction(e.target.value)} options={[{ value: '', label: t('cl.staff.actionNone') }, ...ACTIONS.map((a) => ({ value: a, label: t(`cl.action.${a}`) }))]} />
        </div>
        <Field label={t('cl.staff.details')} hint={t('cl.staff.detailsHint')} multiline rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
        <div><Button type="submit" disabled={busy}>{t('cl.staff.save')}</Button></div>
      </form>
    </section>
  );
};

export default ClaimStaffPanel;
