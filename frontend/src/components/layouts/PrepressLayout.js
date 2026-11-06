import React from 'react';
import AppLayout from './AppLayout';

const portal = {
  key: 'prepress',
  titleKey: 'portal.prepress',
  items: [
    { labelKey: 'nav.orders', href: '/prepress', match: (p) => p === '/prepress' || p.startsWith('/prepress/orders') },
    { labelKey: 'nav.orderHistory', href: '/prepress/history' },
  ],
  more: [
    { labelKey: 'nav.acidSolution', href: '/prepress/acid-solution' },
    { labelKey: 'nav.plateMonitoring', href: '/prepress/plate-monitoring' },
  ],
};

const PrepressLayout = () => <AppLayout portal={portal} />;

export default PrepressLayout;
