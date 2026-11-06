import React from 'react';
import AppLayout from './AppLayout';
import ChatBot from '../common/ChatBot';

const portal = {
  key: 'client',
  titleKey: 'portal.client',
  items: [
    { labelKey: 'nav.dashboard', href: '/client', match: (p) => p === '/client' },
    { labelKey: 'nav.orders', href: '/client/orders' },
    { labelKey: 'nav.claims', href: '/client/claims' },
    { labelKey: 'nav.reports', href: '/client/reports' },
  ],
  extras: <ChatBot />,
};

const ClientLayout = () => <AppLayout portal={portal} />;

export default ClientLayout;
