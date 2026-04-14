import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full`}
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }
        }
        style={{
          borderColor: 'var(--border-primary)',
          borderTopColor: 'var(--accent-primary)'
        }}
      />
      {text && (
        <p 
          className={`${textSizeClasses[size]} font-medium`}
          style={{ color: 'var(--text-muted)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;