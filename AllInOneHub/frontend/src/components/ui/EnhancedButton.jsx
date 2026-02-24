import React from 'react';
import { motion } from 'framer-motion';

const EnhancedButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  glow = false,
  glass = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-4';
  
  const variants = {
    primary: 'btn-primary text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    glass: 'glass-card text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  
  const glowClasses = glow ? 'hover-glow' : '';
  const glassClasses = glass ? 'glass-card' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const buttonClasses = [
    baseClasses,
    variants[variant],
    sizes[size],
    glowClasses,
    glassClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={buttonClasses}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default EnhancedButton;
