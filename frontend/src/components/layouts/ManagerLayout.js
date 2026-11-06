import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'manager',
  title: 'Manager Portal',
  items: [
    { name: 'Dashboard', href: '/manager', match: (p) => p === '/manager' },
    { name: 'Orders', href: '/manager/orders' },
    { name: 'Claims', href: '/manager/claims' },
    { name: 'Tasks', href: '/manager/tasks' },
    { name: 'Employees', href: '/manager/employees' },
    { name: 'Clients', href: '/manager/clients' },
    { name: 'Reports', href: '/manager/reports' },
  ],
  more: [
    { name: 'Barrel Management', href: '/manager/barrel-management' },
    { name: 'Plate Monitoring', href: '/manager/plate-monitoring' },
  ],
};

const ManagerLayout = () => <AppLayout portal={portal} />;

export default ManagerLayout;
