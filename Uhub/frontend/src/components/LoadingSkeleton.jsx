import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const shimmer = {
  initial: { x: -100 },
  animate: { x: 100 },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const SkeletonLine = ({ className = 'h-4 rounded bg-surface-elevated', width = 'w-full' }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={`${width} ${className} overflow-hidden relative`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmer}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? false : 'animate'}
      />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full uhub-card rounded-lg overflow-hidden">
      <thead className="bg-surface-overlay">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-3">
              <SkeletonLine className="h-4 bg-surface-elevated rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-t border-border">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="p-3">
                <SkeletonLine className="h-4 bg-surface-overlay rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const CardSkeleton = ({ cards = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="uhub-card p-6">
        <div className="space-y-4">
          <SkeletonLine className="h-6 bg-surface-elevated rounded" width="w-3/4" />
          <SkeletonLine className="h-4 bg-surface-overlay rounded" />
          <SkeletonLine className="h-4 bg-surface-overlay rounded" width="w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="uhub-card-glass p-6 flex flex-col items-center min-h-[120px]">
        <div className="w-12 h-12 bg-surface-elevated rounded-full mb-4" />
        <SkeletonLine className="h-4 bg-surface-overlay rounded mb-2" width="w-20" />
        <SkeletonLine className="h-8 bg-surface-overlay rounded" width="w-16" />
      </div>
    ))}
  </div>
);

export const Skeleton = SkeletonLine;

export default function LoadingSkeleton({ type = 'card', ...props }) {
  switch (type) {
    case 'table':
      return <TableSkeleton {...props} />;
    case 'stats':
      return <StatsSkeleton {...props} />;
    case 'card':
    default:
      return <CardSkeleton {...props} />;
  }
}
