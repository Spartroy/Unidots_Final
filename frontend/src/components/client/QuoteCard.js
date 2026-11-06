import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

// Client: see the quote and approve (with a typed full name) or reject it.
const QuoteCard = ({ order, onChanged }) => {
  const { t } = useLanguage();
  const quote = order?.quote;
  const [mode, setMode] = useState(null); // 'approve' | 'reject'
  const [signedName, setSignedName] = useState('');
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!quote || !quote.status || quote.status === 'None') return null;

  const money = `${Number(quote.amount).toLocaleString()} ${quote.currency}`;

  const submit = async (decision) => {
    try {
      setBusy(true);
      await api.put(`/api/orders/${order._id}/quote/respond`, { decision, signedName, reason });
      toast.success(decision === 'approve' ? t('quote.client.approvedToast') : t('quote.client.rejectedToast'));
      setMode(null);
      onChanged && onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || t('quote.client.error'));
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <section aria-labelledby="client-quote-title" className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 sm:p-6">
      <h2 id="client-quote-title" className="text-lg font-semibold text-gray-900">{t('quote.client.title')}</h2>
      <p className="mt-2 text-3xl font-bold text-gray-900">{money}</p>
      {quote.note && <p className="mt-2 text-sm text-gray-700">{quote.note}</p>}

      {quote.status === 'Sent' && (
        <>
          {quote.required && <p className="mt-3 text-sm font-medium text-primary-900">{t('quote.client.mustApprove')}</p>}
          {!mode && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setMode('approve')} className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-primary-700 px-6 py-3 text-base font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                {t('quote.client.approve')}
              </button>
              <button type="button" onClick={() => setMode('reject')} className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                {t('quote.client.reject')}
              </button>
            </div>
          )}

          {mode === 'approve' && (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit('approve');
              }}
            >
              <div>
                <label htmlFor="signed-name" className="mb-1 block text-sm font-medium text-gray-700">{t('quote.client.signLabel')}</label>
                <input id="signed-name" required minLength={3} autoComplete="name" value={signedName} onChange={(e) => setSignedName(e.target.value)} className={inputClass} />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-800">
                <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                <span>{t('quote.client.agree', { amount: money })}</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={busy || !agree || signedName.trim().length < 3} className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-primary-700 px-6 py-3 text-base font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
                  {busy ? t('quote.sending') : t('quote.client.confirmApprove')}
                </button>
                <button type="button" onClick={() => setMode(null)} className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50">
                  {t('wizard.cancel')}
                </button>
              </div>
            </form>
          )}

          {mode === 'reject' && (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit('reject');
              }}
            >
              <div>
                <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium text-gray-700">{t('quote.client.reasonLabel')}</label>
                <textarea id="reject-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={busy} className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {busy ? t('quote.sending') : t('quote.client.confirmReject')}
                </button>
                <button type="button" onClick={() => setMode(null)} className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50">
                  {t('wizard.cancel')}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {quote.status === 'Approved' && quote.approval && (
        <p className="mt-3 text-sm text-green-800">{t('quote.client.approvedInfo', { name: quote.approval.signedName, date: new Date(quote.approval.at).toLocaleString() })}</p>
      )}
      {quote.status === 'Rejected' && <p className="mt-3 text-sm text-red-800">{t('quote.client.rejectedInfo')}</p>}
    </section>
  );
};

export default QuoteCard;
