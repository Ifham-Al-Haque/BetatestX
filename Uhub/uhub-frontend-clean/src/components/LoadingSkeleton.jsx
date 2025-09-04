import React from 'react';
import { motion } from 'framer-motion';

// Skeleton animation
const shimmer = {
  initial: { x: -100 },
  animate: { x: 100 },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Basic skeleton line
const SkeletonLine = ({ className = "h-4 bg-gray-200 rounded", width = "w-full" }) => (
  <div className={`${width} ${className} overflow-hidden relative`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
      variants={shimmer}
      initial="initial"
      animate="animate"
    />
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
      <thead className="bg-gray-200 dark:bg-gray-700">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-3">
              <SkeletonLine className="h-4 bg-gray-300 dark:bg-gray-600 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-t border-gray-300 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="p-3">
                <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Card skeleton
export const CardSkeleton = ({ cards = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <SkeletonLine className="h-6 bg-gray-200 dark:bg-gray-700 rounded" width="w-3/4" />
          <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" width="w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

// Dashboard stats skeleton
export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex flex-col items-center min-h-[120px]">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
        <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" width="w-20" />
        <SkeletonLine className="h-8 bg-gray-200 dark:bg-gray-700 rounded" width="w-16" />
      </div>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = "h-64" }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 ${height}`}>
    <div className="space-y-4">
      <SkeletonLine className="h-6 bg-gray-200 dark:bg-gray-700 rounded" width="w-1/3" />
      <div className="flex items-end justify-between h-48 space-x-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent opacity-20"
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-6 bg-gray-200 dark:bg-gray-700 rounded" width="w-1/2" />
        <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" width="w-1/3" />
      </div>
    </div>
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" width="w-1/4" />
          <SkeletonLine className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Generic skeleton
export const Skeleton = ({ className = "h-4 bg-gray-200 rounded", width = "w-full" }) => (
  <SkeletonLine className={className} width={width} />
);

export default Skeleton; 