import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const OperationBreadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-gray-500 mb-4">
      <Link to="/operation" className="inline-flex items-center hover:text-blue-600 transition-colors">
        <Home className="w-3.5 h-3.5 mr-1" />
        Operation
      </Link>
      {items.map((item, i) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-blue-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default OperationBreadcrumb;
