import React from 'react';

export default function Textarea({ className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`uhub-input resize-y min-h-[5rem] ${className}`}
      {...props}
    />
  );
}
