import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DarkModeToggle() {
  const { theme, isDark, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme, isSystem } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const handleToggle = () => {
    toggleTheme();
    setShowOptions(false);
  };

  const handleOptionSelect = (option) => {
    switch (option) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'system':
        setSystemTheme();
        break;
      default:
        break;
    }
    setShowOptions(false);
  };

  return (
    <div className="relative">
      {/* Enhanced Main Toggle Button */}
      <motion.button
        onClick={handleToggle}
        className="relative p-3 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden"
        whileHover={{ 
          scale: 1.05,
          rotateY: 5,
          rotateX: 2
        }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle Dark Mode"
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-3 right-3 w-1 h-1 bg-purple-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </div>

        {/* Icon Container */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="text-gray-700 dark:text-yellow-300 relative"
              >
                <Moon className="w-6 h-6" />
                {/* Glow Effect */}
                <div className="absolute inset-0 w-6 h-6 bg-yellow-300/20 dark:bg-yellow-300/30 rounded-full blur-md" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 180, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -180, opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="text-yellow-500 dark:text-gray-300 relative"
              >
                <Sun className="w-6 h-6" />
                {/* Glow Effect */}
                <div className="absolute inset-0 w-6 h-6 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-full blur-md" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Hover Effects */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Border Glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            backgroundClip: 'padding-box',
            WebkitBackgroundClip: 'padding-box'
          }}
        />
      </motion.button>

      {/* Enhanced Options Dropdown */}
      <AnimatePresence>
        {showOptions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowOptions(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20, rotateX: -15 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="absolute right-0 top-16 z-50 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Theme Settings</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <motion.button
                  onClick={() => handleOptionSelect('light')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                    theme === 'light' && !isSystem
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 rounded-lg ${theme === 'light' && !isSystem ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Sun className={`w-4 h-4 ${theme === 'light' && !isSystem ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Light Mode</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clean and bright interface</p>
                  </div>
                  {theme === 'light' && !isSystem && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                    />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleOptionSelect('dark')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                    theme === 'dark' && !isSystem
                      ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 rounded-lg ${theme === 'dark' && !isSystem ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Moon className={`w-4 h-4 ${theme === 'dark' && !isSystem ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                  </div>
                  {theme === 'dark' && !isSystem && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-purple-500 rounded-full"
                    />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleOptionSelect('system')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                    isSystem
                      ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 rounded-lg ${isSystem ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Monitor className={`w-4 h-4 ${isSystem ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">System</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Follows your OS preference</p>
                  </div>
                  {isSystem && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-green-500 rounded-full"
                    />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Options Toggle Button */}
      <motion.button
        onClick={() => setShowOptions(!showOptions)}
        className="ml-3 p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 shadow-md hover:shadow-lg"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Theme Options"
      >
        <motion.div
          animate={{ rotate: showOptions ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="text-gray-600 dark:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.button>
    </div>
  );
}
