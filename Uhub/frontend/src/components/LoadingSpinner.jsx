import React from 'react';

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  showText = true,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
      {showText && (
        <p className={`mt-2 text-gray-600 ${textSizes[size]}`}>{text}</p>
      )}
    </div>
  );
}

// Loading overlay for full page
export function LoadingOverlay({ 
  message = 'Loading application...',
  showProgress = false,
  progress = 0 
}) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton loading for content
export function SkeletonLoader({ 
  lines = 3, 
  className = '' 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`h-4 bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-10 rounded-t mb-2"></div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-2 mb-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex}
              className={`h-8 bg-gray-200 rounded ${
                colIndex === 0 ? 'w-1/3' : 'flex-1'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
} 