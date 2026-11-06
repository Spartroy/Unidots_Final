import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'manager',
  titleKey: 'portal.manager',
  items: [
    { labelKey: 'nav.dashboard', href: '/manager', match: (p) => p === '/manager' },
    { labelKey: 'nav.orders', href: '/manager/orders' },
    { labelKey: 'nav.claims', href: '/manager/claims' },
    { labelKey: 'nav.tasks', href: '/manager/tasks' },
    { labelKey: 'nav.employees', href: '/manager/employees' },
    { labelKey: 'nav.clients', href: '/manager/clients' },
    { labelKey: 'nav.reports', href: '/manager/reports' },
    { labelKey: 'nav.messages', href: '/manager/messages' },
  ],
  more: [
    { labelKey: 'nav.activity', href: '/manager/activity' },
    { labelKey: 'nav.inventory', href: '/manager/inventory' },
    { labelKey: 'nav.priceList', href: '/manager/price-list' },
    { labelKey: 'nav.barrelManagement', href: '/manager/barrel-management' },
    { labelKey: 'nav.plateMonitoring', href: '/manager/plate-monitoring' },
  ],
};

const ManagerLayout = () => <AppLayout portal={portal} />;

export default ManagerLayout;
