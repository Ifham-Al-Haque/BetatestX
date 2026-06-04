import React from 'react';

const FilterChip = ({ label, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }`}
  >
    {label}
    {count != null && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-500' : 'bg-gray-100'}`}>
        {count}
      </span>
    )}
  </button>
);

export default FilterChip;
