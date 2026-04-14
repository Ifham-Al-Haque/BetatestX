import React from 'react';
import { CardSkeleton, Skeleton, StatsSkeleton } from '../LoadingSkeleton';

const RouteSkeleton = ({ title = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
          <Skeleton className="h-7 bg-gray-200 dark:bg-gray-700 rounded" width="w-64" />
          <div className="mt-2">
            <Skeleton className="h-4 bg-gray-100 dark:bg-gray-700 rounded" width="w-80" />
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>

        <StatsSkeleton />
        <CardSkeleton cards={6} />
      </div>
    </div>
  );
};

export default RouteSkeleton;
