import React from 'react';
import OperationSubLayout from './OperationSubLayout';
import FleetioSubNav from './FleetioSubNav';

const FleetioLayout = ({ title, description, icon, actions, children }) => (
  <OperationSubLayout
    breadcrumbs={[
      { label: 'UDrive Fleetio', href: '/operation/fleetio/modules' },
      { label: title },
    ]}
    title={title}
    description={description}
    icon={icon}
    actions={actions}
    fleetioNav
  >
    {children}
  </OperationSubLayout>
);

export default FleetioLayout;
