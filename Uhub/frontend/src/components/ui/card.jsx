import React from 'react';

export function Card({ children, className = '', glass = false, ...props }) {
  return (
    <div
      className={`${glass ? 'uhub-card-glass' : 'uhub-card'} p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div
      className={`font-bold text-xl mb-4 text-content-primary border-b border-border pb-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
