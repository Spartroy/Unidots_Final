import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'courier',
  titleKey: 'portal.courier',
  items: [{ labelKey: 'nav.dashboard', href: '/courier', match: (p) => p === '/courier' || p.startsWith('/courier/orders') }],
};

const CourierLayout = () => <AppLayout portal={portal} />;

export default CourierLayout;
