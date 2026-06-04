import React from 'react';

const OperationPageHeader = ({ icon: Icon, title, description, actions, badge }) => (
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
    <div className="flex items-start gap-4">
      {Icon && (
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-gray-600 mt-1 max-w-2xl">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default OperationPageHeader;
