import React from 'react';
import AppLayout from './AppLayout';
import ChatBot from '../common/ChatBot';

const portal = {
  key: 'client',
  title: 'Client Portal',
  items: [
    { name: 'Dashboard', href: '/client', match: (p) => p === '/client' },
    { name: 'Orders', href: '/client/orders' },
    { name: 'Claims', href: '/client/claims' },
  ],
  extras: <ChatBot />,
};

const ClientLayout = () => <AppLayout portal={portal} />;

export default ClientLayout;
