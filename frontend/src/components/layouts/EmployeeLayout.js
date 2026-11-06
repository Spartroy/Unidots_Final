import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'employee',
  titleKey: 'portal.employee',
  items: [
    { labelKey: 'nav.dashboard', href: '/employee', match: (p) => p === '/employee' },
    { labelKey: 'nav.orders', href: '/employee/orders' },
    { labelKey: 'nav.claims', href: '/employee/claims' },
  ],
  more: [
    { labelKey: 'nav.tasks', href: '/employee/tasks' },
    { labelKey: 'nav.templates', href: '/employee/templates' },
  ],
};

const EmployeeLayout = () => <AppLayout portal={portal} />;

export default EmployeeLayout;
