import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

const CLOSED = ['Completed', 'Delivered', 'Cancelled'];
const CAN_REQUIRE = ['Submitted', 'Awaiting Approval', 'On Hold'];

const statusStyle = {
  Sent: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

// Manager: prepare a quote (price-list suggestion, editable) and send it to the client.
const QuotePanel = ({ order, onChanged }) => {
  const { t } = useLanguage();
  const quote = order?.quote;
  const [suggestion, setSuggestion] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [required, setRequired] = useState(false);
  const [sending, setSending] = useState(false);

  const orderId = order?._id;
  useEffect(() => {
    if (!orderId) return undefined;
    let alive = true;
    api
      .get(`/api/orders/${orderId}/quote/suggest`)
      .then((res) => {
        if (!alive) return;
        setSuggestion(res.data);
        setAmount((prev) => (prev === '' && res.data.amount > 0 ? String(res.data.amount) : prev));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (!order || CLOSED.includes(order.status)) return null;

  const canRequire = CAN_REQUIRE.includes(order.status);

  const send = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      await api.put(`/api/orders/${order._id}/quote`, { amount: Number(amount), note, required: canRequire && required });
      toast.success(t('quote.sent'));
      setNote('');
      onChanged && onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || t('quote.sendError'));
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <section aria-labelledby="quote-title" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="quote-title" className="text-lg font-semibold text-gray-900">{t('quote.title')}</h3>
        {quote?.status && quote.status !== 'None' && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[quote.status] || ''}`}>{t(`quote.status.${quote.status}`)}</span>
        )}
      </div>

      {quote?.status && quote.status !== 'None' && (
        <dl className="mt-3 space-y-1 text-sm text-gray-700">
          <div>
            <dt className="inline font-medium">{t('quote.amount')}: </dt>
            <dd className="inline">{Number(quote.amount).toLocaleString()} {quote.currency}</dd>
          </div>
          {quote.required && <p className="text-xs text-gray-500">{t('quote.requiredNote')}</p>}
          {quote.status === 'Approved' && quote.approval && (
            <p className="text-green-800">
              {t('quote.approvedBy', { name: quote.approval.signedName, date: new Date(quote.approval.at).toLocaleString() })}
            </p>
          )}
          {quote.status === 'Rejected' && quote.rejectionReason && (
            <p className="text-red-800">{t('quote.rejectedBecause', { reason: quote.rejectionReason })}</p>
          )}
        </dl>
      )}

      <form onSubmit={send} className="mt-4 space-y-4">
        {suggestion && (
          <p className="text-sm text-gray-600" role="status">
            {suggestion.amount > 0
              ? t('quote.suggested', { amount: Number(suggestion.amount).toLocaleString(), currency: suggestion.currency })
              : suggestion.reason === 'missing-rate'
                ? t('quote.noRate')
                : t('quote.noSize')}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="quote-amount" className="mb-1 block text-sm font-medium text-gray-700">{t('quote.amount')} ({suggestion?.currency || 'EGP'})</label>
            <input id="quote-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="quote-note" className="mb-1 block text-sm font-medium text-gray-700">{t('quote.note')}</label>
            <input id="quote-note" type="text" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
        </div>
        <label className={`flex items-start gap-2 text-sm ${canRequire ? 'text-gray-800' : 'text-gray-400'}`}>
          <input type="checkbox" className="mt-1" checked={canRequire && required} disabled={!canRequire} onChange={(e) => setRequired(e.target.checked)} />
          <span>
            {t('quote.requireApproval')}
            {!canRequire && <span className="block text-xs">{t('quote.requireUnavailable')}</span>}
          </span>
        </label>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {sending ? t('quote.sending') : quote?.status === 'Sent' ? t('quote.resend') : t('quote.send')}
        </button>
      </form>
    </section>
  );
};

export default QuotePanel;
