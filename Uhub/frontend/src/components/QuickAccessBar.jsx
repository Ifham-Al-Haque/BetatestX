import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import {
  getAccessibleModules,
  getDefaultQuickPaths,
  getModuleByPath
} from '../config/widgetConfig';
import { getRecentModulePaths } from '../utils/recentModules';

const QuickAccessBar = ({ userRole }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const quickModules = useMemo(() => {
    if (!userRole) return [];

    const seen = new Set();
    const resolved = [];

    const addModule = (path) => {
      if (!path || seen.has(path)) return;
      const mod = getModuleByPath(path, userRole);
      if (!mod || mod.pathname === '/') return;
      seen.add(mod.path);
      resolved.push(mod);
    };

    getRecentModulePaths().forEach(addModule);
    getDefaultQuickPaths(userRole).forEach(addModule);

    if (resolved.length < 4) {
      getAccessibleModules(userRole).forEach((mod) => {
        if (resolved.length >= 4) return;
        addModule(mod.path);
      });
    }

    return resolved.slice(0, 4);
  }, [userRole]);

  if (quickModules.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        <Clock className="w-4 h-4 text-emerald-300/80" />
        <h2 className="text-sm sm:text-base font-semibold text-white/90 tracking-wide">
          Quick access
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
        {quickModules.map((mod, index) => {
          const Icon = mod.icon;
          return (
            <motion.button
              key={mod.path}
              type="button"
              onClick={() => navigate(mod.path)}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.05 }}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.09] border border-white/15 hover:bg-white/[0.15] hover:border-white/25 backdrop-blur-md text-left transition-colors touch-manipulation"
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-200 transition-colors">
                  {mod.label}
                </p>
                <p className="text-xs text-blue-200/70 truncate">{mod.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/80 flex-shrink-0 transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessBar;
