import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Palette, Sparkles, Flame, Snowflake } from 'lucide-react';
import { useEnhancedTheme } from '../context/EnhancedThemeContext';

export default function EnhancedDarkModeToggle() {
  const { 
    theme, 
    isDark, 
    isSystem, 
    currentVariant,
    toggleTheme, 
    setLightTheme, 
    setDarkTheme, 
    setSystemTheme,
    setThemeVariant 
  } = useEnhancedTheme();
  
  const [showOptions, setShowOptions] = useState(false);

  const darkVariants = [
    { key: 'default', name: 'Default', icon: Moon, color: '#3b82f6', description: 'Classic dark mode' },
    { key: 'warm', name: 'Warm', icon: Flame, color: '#fb923c', description: 'Warm orange tones' },
    { key: 'cool', name: 'Cool', icon: Snowflake, color: '#22d3ee', description: 'Cool blue tones' },
    { key: 'deep', name: 'Deep', icon: Sparkles, color: '#8b5cf6', description: 'Ultra dark mode' },
  ];

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

  const handleVariantSelect = (variant) => {
    setThemeVariant(variant);
  };

  return (
    <div className="relative">
      {/* Enhanced Main Toggle Button */}
      <motion.button
        onClick={handleToggle}
        className="relative p-4 rounded-2xl glass-card hover-glow transition-all duration-500 group overflow-hidden"
        whileHover={{ 
          scale: 1.05,
          rotateY: 5,
          rotateX: 2
        }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle Enhanced Dark Mode"
      >
        {/* Animated Background with Variant Colors */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: isDark 
              ? `linear-gradient(135deg, ${darkVariants.find(v => v.key === currentVariant)?.color || '#3b82f6'}20, #8b5cf620, #ec489920)`
              : 'linear-gradient(135deg, #3b82f620, #8b5cf620, #ec489920)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: isDark 
                  ? darkVariants.find(v => v.key === currentVariant)?.color || '#3b82f6'
                  : '#3b82f6',
                top: `${20 + i * 30}%`,
                left: `${15 + i * 25}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
              }}
            />
          ))}
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
                className="relative"
                style={{ color: darkVariants.find(v => v.key === currentVariant)?.color || '#fbbf24' }}
              >
                <Moon className="w-7 h-7" />
                {/* Enhanced Glow Effect */}
                <div 
                  className="absolute inset-0 w-7 h-7 rounded-full blur-lg opacity-30"
                  style={{ 
                    background: darkVariants.find(v => v.key === currentVariant)?.color || '#fbbf24'
                  }}
                />
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
                className="relative text-yellow-500"
              >
                <Sun className="w-7 h-7" />
                {/* Enhanced Glow Effect */}
                <div className="absolute inset-0 w-7 h-7 bg-yellow-500/30 rounded-full blur-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Variant Indicator */}
        {isDark && currentVariant !== 'default' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
            style={{ 
              background: darkVariants.find(v => v.key === currentVariant)?.color 
            }}
          />
        )}

        {/* Enhanced Hover Effects */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: isDark 
              ? `linear-gradient(135deg, ${darkVariants.find(v => v.key === currentVariant)?.color || '#3b82f6'}30, #8b5cf630, #ec489930)`
              : 'linear-gradient(135deg, #3b82f630, #8b5cf630, #ec489930)'
          }}
          initial={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
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
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
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
              className="absolute right-0 top-20 z-50 w-80 enhanced-dropdown overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Enhanced Theme</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Customize your experience</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Theme Mode Selection */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Mode</h4>
                  <div className="space-y-2">
                    <motion.button
                      onClick={() => handleOptionSelect('light')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                        theme.mode === 'light' && !isSystem
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg ${theme.mode === 'light' && !isSystem ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Sun className={`w-4 h-4 ${theme.mode === 'light' && !isSystem ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">Light Mode</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clean and bright interface</p>
                      </div>
                      {theme.mode === 'light' && !isSystem && (
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
                        theme.mode === 'dark' && !isSystem
                          ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg ${theme.mode === 'dark' && !isSystem ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Moon className={`w-4 h-4 ${theme.mode === 'dark' && !isSystem ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">Dark Mode</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                      </div>
                      {theme.mode === 'dark' && !isSystem && (
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
                </div>

                {/* Dark Mode Variants */}
                {isDark && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dark Variants</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {darkVariants.map((variant) => {
                        const Icon = variant.icon;
                        const isActive = currentVariant === variant.key;
                        
                        return (
                          <motion.button
                            key={variant.key}
                            onClick={() => handleVariantSelect(variant.key)}
                            className={`p-3 rounded-xl text-left transition-all duration-300 group relative overflow-hidden ${
                              isActive
                                ? 'border-2 shadow-lg'
                                : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                            style={{
                              borderColor: isActive ? variant.color : undefined,
                              background: isActive ? `${variant.color}10` : undefined
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon 
                                className="w-4 h-4" 
                                style={{ color: variant.color }}
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {variant.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {variant.description}
                            </p>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white"
                                style={{ background: variant.color }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Options Toggle Button */}
      <motion.button
        onClick={() => setShowOptions(!showOptions)}
        className="ml-3 p-3 rounded-xl glass-card hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 shadow-md hover:shadow-lg"
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
