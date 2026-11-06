import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, PauseCircleIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useLanguage } from '../../context/LanguageContext';
import { groupOrdersNeedingAttention } from '../../utils/orderAttention';

const DAY = 24 * 60 * 60 * 1000;

const daysLate = (deadline) => Math.max(1, Math.ceil((Date.now() - new Date(deadline).getTime()) / DAY));

const Group = ({ icon: Icon, tone, title, orders, empty, renderNote, linkBase }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <span className="ms-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{orders.length}</span>
    </div>
    {orders.length === 0 ? (
      <p className="mt-3 text-sm text-gray-500">{empty}</p>
    ) : (
      <ul className="mt-3 divide-y divide-gray-100">
        {orders.slice(0, 5).map((o) => (
          <li key={o._id} className="py-2">
            <Link to={`${linkBase}/${o._id}`} className="block rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <span className="text-sm font-medium text-primary-700">{o.orderNumber}</span>
              <span className="ms-2 text-sm text-gray-700">{o.title}</span>
              <span className="block text-xs text-gray-500">{renderNote(o)}</span>
            </Link>
          </li>
        ))}
      </ul>
    )}
    {orders.length > 5 && <p className="mt-2 text-xs text-gray-500">+{orders.length - 5}</p>}
  </div>
);

const AttentionPanel = () => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/orders?limit=200');
      setGroups(groupOrdersNeedingAttention(res.data.orders));
      setFailed(false);
    } catch (e) {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, 60000, [load]);

  if (failed && !groups) return null; // the rest of the dashboard already reports API problems
  if (!groups) return null;

  const total = groups.overdue.length + groups.onHold.length + groups.unassigned.length;

  return (
    <section aria-labelledby="attention-title" className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 id="attention-title" className="text-lg font-semibold text-gray-900">{t('attention.title')}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${total ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {total ? t('attention.count', { n: total }) : t('attention.allClear')}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Group
          icon={ExclamationTriangleIcon}
          tone="text-red-500"
          title={t('attention.overdue')}
          orders={groups.overdue}
          empty={t('attention.noneOverdue')}
          renderNote={(o) => t('attention.daysLate', { n: daysLate(o.deadline) })}
          linkBase="/manager/orders"
        />
        <Group
          icon={PauseCircleIcon}
          tone="text-orange-500"
          title={t('attention.onHold')}
          orders={groups.onHold}
          empty={t('attention.noneOnHold')}
          renderNote={(o) => o.client?.company || o.client?.name || ''}
          linkBase="/manager/orders"
        />
        <Group
          icon={UserMinusIcon}
          tone="text-yellow-600"
          title={t('attention.unassigned')}
          orders={groups.unassigned}
          empty={t('attention.noneUnassigned')}
          renderNote={(o) => t('attention.submitted', { date: new Date(o.createdAt).toLocaleDateString() })}
          linkBase="/manager/orders"
        />
      </div>
    </section>
  );
};

export default AttentionPanel;
