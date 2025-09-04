import React from 'react';

export default function Button({ children, onClick, type = "button", className = "", ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
