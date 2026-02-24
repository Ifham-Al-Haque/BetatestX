import React from 'react';

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white shadow-md rounded-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`font-bold text-xl mb-4 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
