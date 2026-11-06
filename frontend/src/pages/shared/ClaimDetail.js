import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, DefList, Notice } from '../../design/kit';
import { Skeleton } from '../../design/motionKit';
import ClaimStaffPanel from '../../components/claims/ClaimStaffPanel';
import { AttachmentList, ClaimBadge, ClaimThread, FilePicker, OPEN_STATUSES, uploadFiles, useDate } from '../../components/claims/ClaimBits';

const tr = (t, prefix, v) => (t(`${prefix}.${v}`) === `${prefix}.${v}` ? v : t(`${prefix}.${v}`));

// One claim: facts, files, resolution and the conversation.
const ClaimDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { t, dir } = useLanguage();
  const date = useDate();
  const navigate = useNavigate();
  const base = `/${user.role}/claims`;

  const [claim, setClaim] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const actions = useMemo(() => <Link to={base} className="ud-btn ud-btn-secondary">{t('cl.detail.back')}</Link>, [base, t]);
  usePageChrome({ subtitle: t('cl.subtitle.detail'), actions });

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/api/claims/${id}`);
      setClaim(r.data);
      setError(null);
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 403) setError(t('cl.detail.notFound'));
      else setError(e.response?.data?.message || t('cl.detail.loadError'));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);

  const upload = async () => {
    setBusy(true);
    const { ids, failed } = await uploadFiles(files, { fileType: 'claim', relatedClaim: id });
    try {
      if (ids.length) {
        await api.put(`/api/claims/${id}/attach-files`, { fileIds: ids });
        toast.success(t('cl.detail.uploaded', { n: ids.length }));
      }
      if (failed.length) toast.error(t('cl.form.fileFailed', { names: failed.join(', ') }));
      setFiles(files.filter((f) => failed.includes(f.name)));
      await load();
    } catch (e) {
      toast.error(t('cl.detail.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Notice tone="error">{error} <button type="button" className="ud-link" onClick={() => navigate(base)}>{t('cl.detail.back')}</button></Notice>;
  if (!claim) return <div role="status" aria-label={t('common.loading')}><Skeleton height={320} /></div>;

  const canAddFiles = OPEN_STATUSES.includes(claim.status);
  const r = claim.resolution;
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 900 }} dir={dir}>
      <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="ud-hint">{claim.claimNumber}</div>
            <h2 className="ud-card-h" style={{ marginBlockStart: 2 }}>{claim.title}</h2>
          </div>
          <ClaimBadge status={claim.status} />
        </div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{claim.description}</p>
        <DefList
          dir={dir}
          items={[
            user.role !== 'client' ? [t('cl.detail.client'), claim.client?.name ? `${claim.client.name}${claim.client.company ? ` · ${claim.client.company}` : ''}` : '—'] : null,
            [t('cl.detail.order'), claim.order ? <Link className="ud-link" to={`/${user.role}/orders/${claim.order._id}`}>{claim.order.orderNumber}</Link> : '—'],
            [t('cl.detail.type'), tr(t, 'cl.type', claim.claimType)],
            [t('cl.detail.severity'), tr(t, 'cl.sev', claim.severity)],
            [t('cl.detail.assigned'), claim.assignedTo?.name || t('cl.detail.unassigned')],
            [t('cl.detail.submitted'), date(claim.createdAt, true)],
            [t('cl.detail.updated'), date(claim.updatedAt, true)],
          ].filter(Boolean)}
        />
      </section>

      {r && (r.action || r.details) && (
        <Notice tone="success" title={t('cl.detail.resolution')} dir={dir}>
          {[r.action && `${t('cl.detail.action')}: ${r.action}`, r.details, r.date && `${t('cl.detail.resolvedOn')} ${date(r.date)}`].filter(Boolean).join(' — ')}
        </Notice>
      )}

      {user.role !== 'client' && <ClaimStaffPanel key={claim.updatedAt} claim={claim} role={user.role} onChanged={load} />}

      <section className="ud-card ud-rise" style={{ '--i': 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="ud-card-h">{t('cl.detail.attachments')}</h2>
        <AttachmentList files={claim.files} />
        {canAddFiles && (
          <>
            <h3 style={{ margin: '8px 0 0', font: '600 16px/24px var(--font-sans)' }}>{t('cl.detail.addFiles')}</h3>
            <FilePicker files={files} onChange={setFiles} disabled={busy} />
            {files.length > 0 && <div><Button onClick={upload} disabled={busy}>{busy ? t('cl.detail.uploading') : t('cl.detail.upload')}</Button></div>}
          </>
        )}
      </section>

      <ClaimThread claimId={id} comments={claim.comments} currentUserId={user._id || user.id} onSent={load} />
    </div>
  );
};

export default ClaimDetail;
