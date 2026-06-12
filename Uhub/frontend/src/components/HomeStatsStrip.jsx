import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { getHomeStats } from '../services/homeStatsService';

const subToneClass = {
  warning: 'text-amber-300',
  info: 'text-sky-300',
  success: 'text-emerald-300',
  neutral: 'text-blue-200/70'
};

const HomeStatsStrip = ({ userId, userRole }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getHomeStats({ userId, role: userRole })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, userRole]);

  if (loading) {
    return (
      <div className="mb-8 sm:mb-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        <Activity className="w-4 h-4 text-blue-300/80" />
        <h2 className="text-sm sm:text-base font-semibold text-white/90 tracking-wide">
          At a glance
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.key}
            type="button"
            onClick={() => navigate(stat.path)}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.05 }}
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="group p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.07] border border-white/12 hover:bg-white/[0.12] hover:border-white/22 backdrop-blur-md text-left transition-colors touch-manipulation"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs sm:text-sm text-blue-200/80 font-medium">{stat.label}</p>
              <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0 mt-0.5" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
            <p className={`text-xs mt-1 ${subToneClass[stat.subTone] || subToneClass.neutral}`}>
              {stat.sub}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeStatsStrip;
