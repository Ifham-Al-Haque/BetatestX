import React from 'react';
import { CardSkeleton, Skeleton, StatsSkeleton } from '../LoadingSkeleton';

const RouteSkeleton = ({ title = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-uhub-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="uhub-card-glass p-6">
          <Skeleton className="h-7 bg-surface-elevated rounded" width="w-64" />
          <div className="mt-2">
            <Skeleton className="h-4 bg-surface-overlay rounded" width="w-80" />
          </div>
          <p className="mt-3 text-sm text-content-muted">{title}</p>
        </div>

        <StatsSkeleton />
        <CardSkeleton cards={6} />
      </div>
    </div>
  );
};

export default RouteSkeleton;
