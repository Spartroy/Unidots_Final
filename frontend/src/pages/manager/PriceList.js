import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const FIELDS = [
  ['t114', '1.14 mm'],
  ['t170', '1.7 mm'],
  ['t254', '2.54 mm'],
];

// Manager: the rates used to suggest quotes.
const PriceList = () => {
  const { t } = useLanguage();
  const [rates, setRates] = useState({ t114: '', t170: '', t254: '' });
  const [minimumCharge, setMinimumCharge] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/api/price-list')
      .then((res) => {
        const d = res.data;
        setRates({
          t114: String(d.ratePerCm2PerColor?.t114 ?? 0),
          t170: String(d.ratePerCm2PerColor?.t170 ?? 0),
          t254: String(d.ratePerCm2PerColor?.t254 ?? 0),
        });
        setMinimumCharge(String(d.minimumCharge ?? 0));
        setCurrency(d.currency || 'EGP');
        setLoaded(true);
      })
      .catch((e) => toast.error(e.response?.data?.message || t('pricelist.loadError')));
  }, [t]);

  const save = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/api/price-list', {
        ratePerCm2PerColor: { t114: Number(rates.t114), t170: Number(rates.t170), t254: Number(rates.t254) },
        minimumCharge: Number(minimumCharge),
      });
      toast.success(t('pricelist.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('pricelist.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex h-48 items-center justify-center" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const allZero = Number(rates.t114) === 0 && Number(rates.t170) === 0 && Number(rates.t254) === 0;

  return (
    <form onSubmit={save} className="mx-4 max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow sm:mx-0">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('pricelist.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('pricelist.help', { currency })}</p>
      </div>
      {allZero && <p role="status" className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">{t('pricelist.emptyWarning')}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`rate-${key}`} className="mb-1 block text-sm font-medium text-gray-700">{t('pricelist.rateFor', { thickness: label })}</label>
            <input id={`rate-${key}`} type="number" min="0" step="0.0001" value={rates[key]} onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))} className={inputClass} />
          </div>
        ))}
      </div>
      <div className="max-w-xs">
        <label htmlFor="min-charge" className="mb-1 block text-sm font-medium text-gray-700">{t('pricelist.minimum', { currency })}</label>
        <input id="min-charge" type="number" min="0" step="0.01" value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} className={inputClass} />
      </div>
      <button type="submit" disabled={saving} className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
        {saving ? t('quote.sending') : t('pricelist.save')}
      </button>
    </form>
  );
};

export default PriceList;
