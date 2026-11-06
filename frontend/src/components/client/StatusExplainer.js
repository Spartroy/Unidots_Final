import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getStatusColor } from '../../utils/statusUtils';

// Plain-language "where is my order and what happens next" banner for clients.
const StatusExplainer = ({ status }) => {
  const { t } = useLanguage();
  if (!status) return null;
  const title = t(`status.title.${status}`);
  const next = t(`status.next.${status}`);
  // Unknown status: the translation helper returns the key, so show nothing rather than a raw key.
  if (title.startsWith('status.title.')) return null;

  return (
    <div role="status" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(status)}`}>{title}</span>
      </div>
      <p className="mt-2 text-sm text-gray-700">{next}</p>
    </div>
  );
};

export default StatusExplainer;
