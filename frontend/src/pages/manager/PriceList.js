import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { usePageChrome } from '../../components/shell/PortalShell';
import { Button, Notice } from '../../design/kit';
import { Field } from '../../design/controls';
import { Skeleton } from '../../design/motionKit';

const FIELDS = [['t114', '1.14 mm'], ['t170', '1.7 mm'], ['t254', '2.54 mm']];

// Manager: the rates used to suggest quotes.
const PriceList = () => {
  const { t, dir } = useLanguage();
  const [rates, setRates] = useState({ t114: '', t170: '', t254: '' });
  const [minimumCharge, setMinimumCharge] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const subtitle = useMemo(() => t('pricelist.help', { currency }), [t, currency]);
  usePageChrome({ subtitle });

  useEffect(() => {
    api.get('/api/price-list')
      .then((res) => {
        const d = res.data;
        setRates({ t114: String(d.ratePerCm2PerColor?.t114 ?? 0), t170: String(d.ratePerCm2PerColor?.t170 ?? 0), t254: String(d.ratePerCm2PerColor?.t254 ?? 0) });
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
      await api.put('/api/price-list', { ratePerCm2PerColor: { t114: Number(rates.t114), t170: Number(rates.t170), t254: Number(rates.t254) }, minimumCharge: Number(minimumCharge) });
      toast.success(t('pricelist.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('pricelist.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div role="status" aria-label={t('common.loading')}><Skeleton height={240} /></div>;
  const allZero = Number(rates.t114) === 0 && Number(rates.t170) === 0 && Number(rates.t254) === 0;

  return (
    <form onSubmit={save} dir={dir} noValidate style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      {allZero && <Notice tone="warn">{t('pricelist.emptyWarning')}</Notice>}
      <section className="ud-card ud-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="ud-card-h">{t('pricelist.title')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
          {FIELDS.map(([key, label]) => (
            <Field key={key} label={t('pricelist.rateFor', { thickness: label })} type="number" dir="ltr" min="0" step="0.0001" value={rates[key]} onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))} />
          ))}
        </div>
        <div style={{ maxWidth: 260 }}>
          <Field label={t('pricelist.minimum', { currency })} type="number" dir="ltr" min="0" step="0.01" value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} />
        </div>
        <div><Button type="submit" disabled={saving}>{saving ? t('quote.sending') : t('pricelist.save')}</Button></div>
      </section>
    </form>
  );
};

export default PriceList;
