import React from 'react';
import AppLayout from './AppLayout';

// Arabic labels are kept until the EN/AR toggle lands (planned).
const portal = {
  key: 'prepress',
  title: 'Prepress Portal',
  items: [
    { name: 'الأوردرات', href: '/prepress', match: (p) => p === '/prepress' || p.startsWith('/prepress/orders') },
    { name: 'الأوردرات السابقة', href: '/prepress/history' },
  ],
  more: [
    { name: 'Acid Solution', href: '/prepress/acid-solution' },
    { name: 'Plate Monitoring', href: '/prepress/plate-monitoring' },
  ],
};

const PrepressLayout = () => <AppLayout portal={portal} />;

export default PrepressLayout;
