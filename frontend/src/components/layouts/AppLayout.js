import React from 'react';
import PortalShell from '../shell/PortalShell';

// Every portal layout (Client, Employee, Prepress, Manager, Courier) renders inside the design-system shell.
const AppLayout = ({ portal }) => <PortalShell portal={portal} />;

export default AppLayout;
