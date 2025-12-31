import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Users, 
  Shield, 
  Car, 
  Building, 
  Cog,
  Calendar,
  FileText,
  Headphones,
  AlertTriangle,
  CheckSquare,
  Inbox,
  Lightbulb,
  Heart,
  Camera,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import WidgetNavigation from '../components/WidgetNavigation';

const UserWelcome = () => {
  const { user, userProfile, role } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and performance metrics for informed decision making',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Efficiently manage your team, track performance, and foster collaboration',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      icon: Calendar,
      title: 'Task & Calendar',
      description: 'Organize your schedule, manage tasks, and stay on top of deadlines',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: Shield,
      title: 'Security & Access',
      description: 'Enterprise-grade security with role-based access control and monitoring',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const benefits = [
    'Unified platform for all departments',
    'Real-time collaboration tools',
    'Advanced security & compliance',
    '24/7 system availability',
    'Mobile-responsive design',
    'Comprehensive reporting suite'
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleFeatureClick = (index) => {
    setCurrentFeature(index);
  };

  const getWelcomeMessage = () => {
    if (role === 'admin') {
      return {
        title: "Welcome back, Administrator!",
        subtitle: "You have full access to manage the entire system with powerful tools and comprehensive oversight",
        color: "from-red-500 to-pink-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        icon: Shield,
        iconColor: "from-red-500 to-pink-600"
      };
    } else if (role === 'employee') {
      return {
        title: "Welcome back, Team Member!",
        subtitle: "Access your personalized tools, manage tasks efficiently, and collaborate seamlessly with your team",
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        icon: Users,
        iconColor: "from-blue-500 to-indigo-600"
      };
    } else {
      return {
        title: "Welcome back!",
        subtitle: "Access your personalized dashboard and explore the powerful features available to you",
        color: "from-gray-600 to-gray-800",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        icon: Home,
        iconColor: "from-gray-500 to-gray-700"
      };
    }
  };

  const getQuickActions = () => {
    const actions = [
      { label: 'Profile', path: '/profile', icon: Users, color: 'from-emerald-500 to-emerald-600', description: 'Manage account' },
      { label: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'from-purple-500 to-purple-600', description: 'Track progress' },
      { label: 'Calendar', path: '/calendar-view', icon: Calendar, color: 'from-orange-500 to-orange-600', description: 'Schedule view' }
    ];

    // Add role-specific actions
    if (role === 'admin') {
      // Only admin users can access the dashboard
      actions.unshift({ label: 'Dashboard', path: '/dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600', description: 'View analytics' });
      actions.push(
        { label: 'Admin Panel', path: '/admin/dashboard', icon: Shield, color: 'from-red-500 to-red-600', description: 'System control' },
        { label: 'User Management', path: '/user-management', icon: Users, color: 'from-indigo-500 to-indigo-600', description: 'Manage users' }
      );
    }

    if (role === 'employee' || role === 'admin') {
      actions.push(
        { label: 'IT Requests', path: '/it-requests', icon: Cog, color: 'from-teal-500 to-teal-600', description: 'Tech support' },
        { label: 'Complaints', path: '/complaints', icon: AlertTriangle, color: 'from-yellow-500 to-yellow-600', description: 'Issue tracking' }
      );
    }

    return actions;
  };

  const welcome = getWelcomeMessage();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Enhanced Header with Glass Effect - Mobile Optimized */}
      <div className="relative z-10 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent truncate">
                UHub
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 truncate">Unified platform for all departments</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="text-right text-white hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[120px]">{userProfile?.full_name || user?.email}</p>
              <p className="text-xs text-blue-200 capitalize">{role || 'User'}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-semibold text-xs sm:text-sm">
                {(userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Mobile Optimized */}
      <div className="relative px-3 sm:px-4 md:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto text-center">
          {/* Animated welcome text */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-8 shadow-2xl"
            >
              <welcome.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight px-2">
              {welcome.title.split('!')[0]}!{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {welcome.title.split('!')[1] || ''}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
              {welcome.subtitle}
            </p>
          </div>

          {/* Enhanced Widget Navigation - Mobile Optimized */}
          <div className={`mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
              <WidgetNavigation userRole={role || userProfile?.role || user?.role} />
            </div>
          </div>

          {/* Trust indicators - Mobile Optimized */}
          <div className={`flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-white/70 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Global Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase - Mobile Optimized */}
      <div className="relative px-3 sm:px-4 md:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 px-2">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                {role === 'admin' ? 'Administrators' : 'Team Members'}
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-blue-100 max-w-3xl mx-auto px-2">
              From analytics to task management, we provide comprehensive tools 
              that streamline your workflow and boost productivity.
            </p>
          </div>
          
          {/* Feature Cards - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-12 md:mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${feature.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center hover:transform hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10 backdrop-blur-sm touch-manipulation ${
                  index === currentFeature ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/25' : ''
                }`}
                onClick={() => handleFeatureClick(index)}
                style={{
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Feature Navigation */}
          <div className="flex justify-center space-x-3">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => handleFeatureClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentFeature
                    ? 'bg-blue-500 scale-125'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* System Status Section */}
      <div className="relative px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              System{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Status
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">System Status</h4>
              <p className="text-blue-200 mb-4">All systems are running smoothly</p>
              <div className="flex items-center justify-center text-emerald-400">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">Operational</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Team Activity</h4>
              <p className="text-blue-200 mb-4">Your team is active and productive</p>
              <div className="text-sm text-blue-200">
                Last activity: Just now
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Updates</h4>
              <p className="text-blue-200 mb-4">System is up to date</p>
              <div className="text-sm text-blue-200">
                Version: 2.1.0
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserWelcome;
