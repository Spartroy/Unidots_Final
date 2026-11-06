import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'employee',
  title: 'Employee Portal',
  items: [
    { name: 'Dashboard', href: '/employee', match: (p) => p === '/employee' },
    { name: 'Orders', href: '/employee/orders' },
    { name: 'Claims', href: '/employee/claims' },
  ],
  more: [
    { name: 'Tasks', href: '/employee/tasks' },
    { name: 'Templates', href: '/employee/templates' },
  ],
};

const EmployeeLayout = () => <AppLayout portal={portal} />;

export default EmployeeLayout;
