import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, Users, Shield, Zap, Globe } from 'lucide-react';
import WidgetNavigation from '../components/WidgetNavigation';
import QuickAccessBar from '../components/QuickAccessBar';
import HomeStatsStrip from '../components/HomeStatsStrip';

const UserWelcome = () => {
  const { user, userProfile, role } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const userRole = role || userProfile?.role || user?.role;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getWelcomeMessage = () => {
    if (role === 'admin') {
      return {
        subtitle: 'You have full access to manage the entire system with powerful tools and comprehensive oversight',
        icon: Shield,
        iconColor: 'from-red-500 to-pink-600'
      };
    }
    if (role === 'employee') {
      return {
        subtitle: 'Access your personalized tools, manage tasks efficiently, and collaborate seamlessly with your team',
        icon: Users,
        iconColor: 'from-blue-500 to-indigo-600'
      };
    }
    return {
      subtitle: 'Access your personalized dashboard and explore the powerful features available to you',
      icon: Home,
      iconColor: 'from-gray-500 to-gray-700'
    };
  };

  const welcome = getWelcomeMessage();

  const getRoleHighlight = () => {
    if (role === 'admin') return 'Administrator';
    if (role === 'employee') return 'Team Member';
    return userProfile?.full_name?.split(' ')[0] || 'there';
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden -m-3 sm:-m-6 md:-m-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      {!prefersReducedMotion && (
        <>
          <motion.div
            aria-hidden
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl"
            animate={{ x: [0, 40, -10, 0], y: [0, 20, 35, 0], opacity: [0.45, 0.6, 0.5, 0.45] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute top-40 -right-28 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
            animate={{ x: [0, -35, 15, 0], y: [0, 25, -10, 0], opacity: [0.35, 0.55, 0.4, 0.35] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="relative px-3 sm:px-4 md:px-6 pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-emerald-300/80 mb-3 sm:mb-4 font-medium">
              {getTimeGreeting()}
            </p>
            <motion.div
              animate={prefersReducedMotion ? {} : { rotate: [0, 4, -4, 0] }}
              transition={prefersReducedMotion ? {} : { duration: 3.2, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
              className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br ${welcome.iconColor} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl ring-2 ring-white/20`}
            >
              <welcome.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight px-2">
              Welcome back,{' '}
              <span className={`bg-gradient-to-r ${welcome.iconColor} bg-clip-text text-transparent`}>
                {getRoleHighlight()}!
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-100/90 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
              {welcome.subtitle}
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <QuickAccessBar userRole={userRole} />
          </div>

          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <HomeStatsStrip userId={user?.id} userRole={userRole} />
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
              <WidgetNavigation userRole={userRole} />
            </div>
          </div>

          <div className={`mt-10 sm:mt-12 flex flex-wrap justify-center items-center gap-3 sm:gap-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { icon: Shield, label: 'Enterprise Security', color: 'text-emerald-400' },
              { icon: Zap, label: 'Lightning Fast', color: 'text-blue-400' },
              { icon: Globe, label: 'Global Access', color: 'text-purple-400' }
            ].map(({ icon: TrustIcon, label, color }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/80"
              >
                <TrustIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color} flex-shrink-0`} />
                <span className="text-xs sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;
