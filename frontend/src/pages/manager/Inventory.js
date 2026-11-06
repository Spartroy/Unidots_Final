import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';

const MATERIALS = ['Flint', 'Strong', 'Taiwan', 'Other'];
const THICKNESSES = [1.14, 1.7, 2.54];
const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

const ItemRow = ({ item, onChanged }) => {
  const { t } = useLanguage();
  const [receive, setReceive] = useState('');
  const [count, setCount] = useState('');
  const [threshold, setThreshold] = useState(String(item.lowStockThreshold));
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMsg) => {
    try {
      setBusy(true);
      await fn();
      if (okMsg) toast.success(okMsg);
      onChanged();
    } catch (e) {
      toast.error(e.response?.data?.message || t('inventory.error'));
    } finally {
      setBusy(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get(`/api/inventory/${item._id}/movements`);
      setHistory(res.data);
    } catch (e) {
      toast.error(t('inventory.error'));
    }
  };

  return (
    <li className="rounded-lg bg-white p-4 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{item.material} · {item.thickness} mm</p>
          <p className="text-sm text-gray-600">{t('inventory.onHand')}: <b>{item.quantity} m²</b></p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.low ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {item.low ? t('inventory.low') : t('inventory.ok')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.post(`/api/inventory/${item._id}/receive`, { quantity: Number(receive) }), t('inventory.received')).then(() => setReceive(''));
          }}
        >
          <label htmlFor={`rec-${item._id}`} className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.receive')} (m²)</label>
          <div className="flex gap-2">
            <input id={`rec-${item._id}`} type="number" min="0" step="0.01" required value={receive} onChange={(e) => setReceive(e.target.value)} className={inputClass} />
            <button type="submit" disabled={busy} className="rounded-md bg-primary-700 px-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">+</button>
          </div>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.post(`/api/inventory/${item._id}/adjust`, { quantity: Number(count) }), t('inventory.counted')).then(() => setCount(''));
          }}
        >
          <label htmlFor={`cnt-${item._id}`} className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.count')} (m²)</label>
          <div className="flex gap-2">
            <input id={`cnt-${item._id}`} type="number" step="0.01" required value={count} onChange={(e) => setCount(e.target.value)} className={inputClass} />
            <button type="submit" disabled={busy} className="rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50">{t('inventory.set')}</button>
          </div>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.put(`/api/inventory/${item._id}`, { lowStockThreshold: Number(threshold) }), t('inventory.thresholdSaved'));
          }}
        >
          <label htmlFor={`thr-${item._id}`} className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.alertBelow')} (m²)</label>
          <div className="flex gap-2">
            <input id={`thr-${item._id}`} type="number" min="0" step="0.01" required value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
            <button type="submit" disabled={busy} className="rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50">{t('inventory.save')}</button>
          </div>
        </form>
      </div>

      <details className="mt-4" onToggle={(e) => e.target.open && !history && loadHistory()}>
        <summary className="cursor-pointer text-sm font-medium text-primary-700">{t('inventory.history')}</summary>
        {history && history.length === 0 && <p className="mt-2 text-sm text-gray-500">{t('inventory.noHistory')}</p>}
        {history && history.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100 text-sm">
            {history.map((m) => (
              <li key={m._id} className="flex flex-wrap justify-between gap-2 py-1">
                <span>
                  {new Date(m.createdAt).toLocaleDateString()} · {t(`inventory.reason.${m.reason}`)}
                  {m.order?.orderNumber ? ` · ${m.order.orderNumber}` : ''}
                </span>
                <span className={m.delta < 0 ? 'text-red-700' : 'text-green-700'}>{m.delta > 0 ? '+' : ''}{m.delta} m²</span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </li>
  );
};

const Inventory = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ material: 'Flint', thickness: '1.7', quantity: '', lowStockThreshold: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/inventory');
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || t('inventory.loadError'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  const add = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      await api.post('/api/inventory', {
        material: form.material,
        thickness: Number(form.thickness),
        quantity: Number(form.quantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
      });
      toast.success(t('inventory.added'));
      setForm((f) => ({ ...f, quantity: '', lowStockThreshold: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('inventory.error'));
    } finally {
      setAdding(false);
    }
  };

  if (error && !data) {
    return (
      <div role="alert" className="rounded-lg bg-white p-6 text-center shadow">
        <p className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={load} className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white">{t('common.retry')}</button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { items, solvent } = data;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <p className="text-sm text-gray-600">{t('inventory.help')}</p>

      {solvent && (
        <section aria-labelledby="solvent-title" className="rounded-lg bg-white p-4 shadow">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="solvent-title" className="font-semibold text-gray-900">{t('inventory.solvent')}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${solvent.low ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {solvent.low ? t('inventory.low') : t('inventory.ok')}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {t('inventory.solventLevel', { liters: Math.round(solvent.currentLiters), barrels: solvent.totalBarrels })}
          </p>
          <Link to="/manager/barrel-management" className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline">{t('inventory.manageBarrels')}</Link>
        </section>
      )}

      <section aria-labelledby="plates-title" className="space-y-3">
        <h2 id="plates-title" className="font-semibold text-gray-900">{t('inventory.plates')}</h2>
        {items.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow">{t('inventory.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <ItemRow key={item._id} item={item} onChanged={load} />
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={add} className="rounded-lg bg-white p-4 shadow">
        <h2 className="font-semibold text-gray-900">{t('inventory.addTitle')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="new-material" className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.material')}</label>
            <select id="new-material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={inputClass}>
              {MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="new-thickness" className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.thickness')}</label>
            <select id="new-thickness" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} className={inputClass}>
              {THICKNESSES.map((v) => <option key={v} value={v}>{v} mm</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="new-qty" className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.opening')} (m²)</label>
            <input id="new-qty" type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new-thr" className="mb-1 block text-xs font-medium text-gray-600">{t('inventory.alertBelow')} (m²)</label>
            <input id="new-thr" type="number" min="0" step="0.01" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className={inputClass} />
          </div>
        </div>
        <button type="submit" disabled={adding} className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
          {t('inventory.add')}
        </button>
      </form>
    </div>
  );
};

export default Inventory;
