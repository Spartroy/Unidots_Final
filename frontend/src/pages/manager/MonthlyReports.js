import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Pager, SearchField, Select } from '../../design/controls';
import { Button, DataTable, EmptyState, KpiTile, Notice } from '../../design/kit';
import { CountUp, Skeleton } from '../../design/motionKit';
import { areaM2 } from '../../utils/area';

const PAGE = 25;
const ACID_COST_PER_M2 = 424.44; // matches the previous report: solvent cost estimate per square metre of plate

// Manager: orders completed in one month, with revenue, cost and a CSV export.
const MonthlyReports = () => {
  const { t, lang, dir } = useLanguage();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [orders, setOrders] = useState(null);
  const [acid, setAcid] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const actions = useMemo(() => null, []);
  usePageChrome({ subtitle: t('mr.subtitle'), actions });

  const monthName = useCallback((m) => new Date(2000, m, 1).toLocaleString(locale, { month: 'long' }), [locale]);
  const money = (n) => Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 0 });

  const load = useCallback(async () => {
    try {
      setError(null);
      const [r, a] = await Promise.all([
        api.get('/api/orders/monthly-reports', { params: { month: month + 1, year, page, limit: PAGE } }),
        api.get('/api/acid-solution/monthly-report', { params: { month: month + 1, year } }).catch(() => ({ data: null })),
      ]);
      setOrders(r.data.orders || []);
      setPageInfo({ page: r.data.page || 1, pages: r.data.pages || 1, total: r.data.total || 0 });
      setAcid(a.data);
    } catch (e) {
      setError(e.response?.data?.message || t('mr.loadError'));
    }
  }, [month, year, page, t]);
  useEffect(() => {
    setOrders(null);
    load();
  }, [load]);
  useEffect(() => setPage(1), [month, year]);

  const download = async () => {
    try {
      setBusy(true);
      const r = await api.get('/api/orders/monthly-reports/csv', { params: { month: month + 1, year }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-report-${year}-${String(month + 1).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t('mr.downloaded'));
    } catch (e) {
      toast.error(t('mr.downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  const list = useMemo(() => orders || [], [orders]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => [o.orderNumber, o.title, o.clientName, o.material].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [list, search]);

  const revenue = list.reduce((s, o) => s + (o.estimatedPrice || 0), 0);
  const processing = acid?.processingCosts ?? list.reduce((s, o) => s + areaM2(o.dimensions) * ACID_COST_PER_M2, 0);
  const acidCost = acid?.acidSolutionCosts || 0;
  const profit = revenue - processing - acidCost;
  const kpis = [
    ['orders', 'orders', pageInfo.total, null],
    ['revenue', 'reports', revenue, t('mr.kpi.noteRevenue')],
    ['processing', 'tasks', processing, null],
    ['acid', 'claims', acidCost, null],
    ['profit', 'reports', profit, null],
  ];

  const rows = shown.map((o) => ({
    o: <Link className="ud-link" to={`/manager/orders/${o._id}`}>{o.orderNumber}</Link>,
    t: o.title,
    c: o.clientName,
    m: o.material ? `${o.material}${o.materialThickness ? ` ${o.materialThickness}` : ''}` : '—',
    s: o.dimensions?.width ? <bdi dir="ltr">{`${o.dimensions.width}×${o.dimensions.height} ${o.dimensions.unit || 'mm'}`}</bdi> : '—',
    k: o.colors ?? '—',
    p: <bdi dir="ltr">{money(o.estimatedPrice)}</bdi>,
    d: o.completedAt ? new Date(o.completedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
  }));

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }} dir={dir}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 170 }}><Select label={t('mr.month')} value={month} onChange={(e) => setMonth(Number(e.target.value))} options={Array.from({ length: 12 }, (_, i) => ({ value: i, label: monthName(i) }))} /></div>
          <div style={{ minWidth: 120 }}><Select label={t('mr.year')} value={year} onChange={(e) => setYear(Number(e.target.value))} options={Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))} /></div>
        </div>
        <Button onClick={download} disabled={busy || list.length === 0}>{busy ? t('mr.downloading') : t('mr.download')}</Button>
      </div>

      {error && <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>}
      {!orders && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={320} /></div>}

      {orders && (
        <>
          <div className="ud-grid ud-grid-6">
            {kpis.map(([k, icon, v, note], i) => (
              <div key={k} className="ud-rise" style={{ '--i': i }}>
                <KpiTile dir={dir} icon={icon} label={t(`mr.kpi.${k}`)} value={<CountUp value={Math.round(v)} />} note={note || undefined} tone={k === 'profit' && profit < 0 ? 'attention' : undefined} />
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 420 }}>
            <SearchField dir={dir} label={t('mr.search')} placeholder={t('mr.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {shown.length === 0 ? (
            <EmptyState dir={dir} title={search ? t('mr.emptyMatch') : t('mr.empty')} />
          ) : (
            <div className="ud-card ud-pad0 ud-rise">
              <DataTable
                dir={dir}
                caption={`${monthName(month)} ${year}`}
                columns={[
                  { key: 'o', label: t('mr.col.order') },
                  { key: 't', label: t('mr.col.title') },
                  { key: 'c', label: t('mr.col.client') },
                  { key: 'm', label: t('mr.col.material') },
                  { key: 's', label: t('mr.col.size') },
                  { key: 'k', label: t('mr.col.colors') },
                  { key: 'p', label: t('mr.col.price') },
                  { key: 'd', label: t('mr.col.done') },
                ]}
                rows={rows}
              />
            </div>
          )}
          {pageInfo.total > PAGE && <Pager dir={dir} page={page} pages={pageInfo.pages} onPage={setPage} summary={t('ol.showing', { from: (page - 1) * PAGE + 1, to: Math.min(page * PAGE, pageInfo.total), total: pageInfo.total })} />}
          <p className="ud-hint">{t('mr.note')}</p>
        </>
      )}
    </>
  );
};

export default MonthlyReports;
