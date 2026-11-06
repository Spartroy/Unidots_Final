import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { reportToCsv } from '../../utils/reportCsv';

// Client: own orders and spending by month, with CSV export.
const Reports = () => {
  const { t, lang } = useLanguage();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

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

  const monthName = (m) => new Date(2000, m - 1, 1).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' });

  const download = () => {
    const names = Array.from({ length: 12 }, (_, i) => monthName(i + 1));
    const csv = reportToCsv(report, names, {
      month: t('reports.month'),
      orders: t('reports.orders'),
      completed: t('reports.completed'),
      cancelled: t('reports.cancelled'),
      value: t('reports.value'),
      total: t('reports.total'),
    });
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unidots-report-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const years = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3];

  return (
    <div className="space-y-4 px-4 sm:px-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="report-year" className="mb-1 block text-sm font-medium text-gray-700">{t('reports.year')}</label>
          <select id="report-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" onClick={download} disabled={!report} className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
          {t('reports.download')}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-white p-6 text-center shadow">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={load} className="mt-3 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white">{t('common.retry')}</button>
        </div>
      )}

      {!report && !error && (
        <div className="flex h-40 items-center justify-center" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['orders', report.totals.orders],
              ['completed', report.totals.completed],
              ['cancelled', report.totals.cancelled],
              ['value', Number(report.totals.value).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white p-4 shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t(`reports.${k}`)}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <caption className="sr-only">{t('reports.caption', { year })}</caption>
              <thead className="bg-gray-50">
                <tr>
                  {['month', 'orders', 'completed', 'cancelled', 'value'].map((k) => (
                    <th key={k} scope="col" className="px-4 py-3 text-start font-semibold text-gray-700">{t(`reports.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.months.map((m) => (
                  <tr key={m.month} className={m.orders ? '' : 'text-gray-400'}>
                    <th scope="row" className="px-4 py-2 text-start font-medium">{monthName(m.month)}</th>
                    <td className="px-4 py-2">{m.orders}</td>
                    <td className="px-4 py-2">{m.completed}</td>
                    <td className="px-4 py-2">{m.cancelled}</td>
                    <td className="px-4 py-2">{Number(m.value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">{t('reports.note')}</p>
        </>
      )}
    </div>
  );
};

export default Reports;
