import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'uhub-btn-primary',
    secondary: 'uhub-btn-secondary',
    outline:
      'bg-transparent border border-border text-content-primary hover:bg-surface-overlay hover:border-border-accent focus:ring-accent',
    ghost:
      'bg-transparent text-content-secondary hover:bg-surface-overlay hover:text-content-primary focus:ring-accent',
    danger:
      'bg-accent-danger hover:opacity-90 text-white focus:ring-accent-danger shadow-uhub-sm',
    success:
      'bg-accent-success hover:opacity-90 text-white focus:ring-accent-success shadow-uhub-sm',
  };

  const sizes = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
