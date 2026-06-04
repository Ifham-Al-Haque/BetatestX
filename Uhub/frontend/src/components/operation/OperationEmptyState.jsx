import React from 'react';
import { Inbox } from 'lucide-react';

const OperationEmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
      <Icon className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{description}</p>}
    {action}
  </div>
);

export default OperationEmptyState;
