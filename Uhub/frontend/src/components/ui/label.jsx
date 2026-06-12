import React from 'react';

export default function Label({ htmlFor, children, className = '', ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-content-secondary mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
