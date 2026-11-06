import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Select } from '../../design/controls';
import { Button, DataTable, KpiTile, Notice, TrendChart } from '../../design/kit';
import { CountUp, Skeleton } from '../../design/motionKit';
import { reportToCsv } from '../../utils/reportCsv';

// Client: own orders and spending by month, with CSV export.
const Reports = () => {
  const { t, lang, dir } = useLanguage();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  usePageChrome({ subtitle: t('reports.caption', { year }) });

  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const monthName = useCallback((m, style = 'long') => new Date(2000, m - 1, 1).toLocaleString(locale, { month: style }), [locale]);
  const num = (v) => Number(v).toLocaleString(locale);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/api/orders/client-report?year=${year}`);
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.message || t('reports.loadError'));
    }
  }, [year, t]);
  useEffect(() => {
    setReport(null);
    load();
  }, [load]);

  const download = () => {
    const names = Array.from({ length: 12 }, (_, i) => monthName(i + 1));
    const csv = reportToCsv(report, names, {
      month: t('reports.month'), orders: t('reports.orders'), completed: t('reports.completed'),
      cancelled: t('reports.cancelled'), value: t('reports.value'), total: t('reports.total'),
    });
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `unidots-report-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const points = useMemo(() => (report ? report.months.map((m) => ({ label: monthName(m.month, 'short'), value: m.orders })) : []), [report, monthName]);
  const rows = report
    ? [
        ...report.months.map((m) => ({ m: monthName(m.month), o: num(m.orders), c: num(m.completed), x: num(m.cancelled), v: num(m.value), dim: !m.orders })),
        { m: <b>{t('reports.total')}</b>, o: <b>{num(report.totals.orders)}</b>, c: <b>{num(report.totals.completed)}</b>, x: <b>{num(report.totals.cancelled)}</b>, v: <b>{num(report.totals.value)}</b> },
      ]
    : [];
  const kpis = report ? [['orders', 'orders', report.totals.orders], ['completed', 'tasks', report.totals.completed], ['cancelled', 'claims', report.totals.cancelled], ['value', 'reports', report.totals.value]] : [];

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }} dir={dir}>
        <div style={{ minWidth: 160 }}>
          <Select label={t('reports.year')} value={year} onChange={(e) => setYear(Number(e.target.value))} options={[0, 1, 2, 3].map((d) => String(thisYear - d))} />
        </div>
        <Button onClick={download} disabled={!report}>{t('reports.download')}</Button>
      </div>

      {error && <Notice tone="error">{error} <button type="button" className="ud-link" onClick={load}>{t('common.retry')}</button></Notice>}
      {!report && !error && <div role="status" aria-label={t('common.loading')}><Skeleton height={320} /></div>}

      {report && (
        <>
          <div className="ud-grid ud-grid-6">
            {kpis.map(([k, icon, v], i) => (
              <div key={k} className="ud-rise" style={{ '--i': i }}>
                <KpiTile dir={dir} icon={icon} label={t(`reports.${k}`)} value={<CountUp value={Number(v)} />} />
              </div>
            ))}
          </div>

          <section className="ud-card ud-rise" style={{ '--i': 4 }}>
            <h2 className="ud-card-h">{t('reports.orders')}</h2>
            <TrendChart points={points} label={t('reports.caption', { year })} emptyText={t('reports.caption', { year })} />
          </section>

          <div className="ud-card ud-pad0 ud-rise" style={{ '--i': 5 }}>
            <DataTable
              dir={dir}
              caption={t('reports.caption', { year })}
              columns={[
                { key: 'm', label: t('reports.month') },
                { key: 'o', label: t('reports.orders') },
                { key: 'c', label: t('reports.completed') },
                { key: 'x', label: t('reports.cancelled') },
                { key: 'v', label: t('reports.value') },
              ]}
              rows={rows}
            />
          </div>
          <p className="ud-hint">{t('reports.note')}</p>
        </>
      )}
    </>
  );
};

export default Reports;
