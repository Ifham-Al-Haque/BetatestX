import React from 'react';

export default function Input({ type = "text", className = "", ...props }) {
  return (
    <input
      type={type}
      className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}
