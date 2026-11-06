import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'courier',
  title: 'Courier Portal',
  items: [{ name: 'Dashboard', href: '/courier', match: (p) => p === '/courier' || p.startsWith('/courier/orders') }],
};

const CourierLayout = () => <AppLayout portal={portal} />;

export default CourierLayout;
