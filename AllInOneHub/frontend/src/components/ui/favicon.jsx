import React from 'react';

const Favicon = ({ 
  size = 'sm', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const logoSource = {
    default: '/logo.png',
    positive: '/logo.png',
    negative: '/logo.png',
    favicon: '/favicon.ico'
  };

  return (
    <img 
      src={logoSource[variant]} 
      alt="Corevanta" 
      className={`${sizeClasses[size]} ${className}`}
      onError={(e) => { e.target.onerror = null; e.target.src = '/favicon.ico'; }}
    />
  );
};

export default Favicon;
