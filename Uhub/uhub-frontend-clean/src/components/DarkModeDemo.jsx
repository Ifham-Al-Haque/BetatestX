import React from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../hooks/useDarkMode';
import DarkModeToggle from './DarkModeToggle';

export default function DarkModeDemo() {
  const { isDark, theme, toggle } = useDarkMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dark Mode Demo
        </h2>
        <DarkModeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Theme Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Current Theme
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Theme:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {theme}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Mode:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isDark 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {isDark ? 'Active' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Theme Features */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System preference detection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Smooth transitions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Persistent storage
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Animated icons
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Dropdown options
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggle}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Toggle Theme
          </button>
          <button
            onClick={() => useDarkMode().setLight()}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Force Light
          </button>
          <button
            onClick={() => useDarkMode().setDark()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Force Dark
          </button>
          <button
            onClick={() => useDarkMode().setSystem()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Follow System
          </button>
        </div>
      </div>

      {/* CSS Variables Demo */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          CSS Variables in Action
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded mx-auto mb-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Primary</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded mx-auto mb-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Secondary</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-[var(--color-accent)] rounded mx-auto mb-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Accent</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-[var(--color-text-primary)] rounded mx-auto mb-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Text</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
