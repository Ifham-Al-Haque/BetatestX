import React from 'react';
import OperationBreadcrumb from './OperationBreadcrumb';
import OperationPageHeader from './OperationPageHeader';
import FleetioSubNav from './FleetioSubNav';

const OperationSubLayout = ({
  breadcrumbs = [],
  title,
  description,
  icon,
  actions,
  badge,
  fleetioNav = false,
  children,
  maxWidth = 'max-w-7xl',
}) => (
  <div className="min-h-screen bg-gray-50">
    <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
      <OperationBreadcrumb items={breadcrumbs} />
      <OperationPageHeader icon={icon} title={title} description={description} actions={actions} badge={badge} />
      {fleetioNav && (
        <div className="mb-6 border-b border-gray-200 pb-3">
          <FleetioSubNav />
        </div>
      )}
      {children}
    </div>
  </div>
);

export default OperationSubLayout;
