import React from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Sparkles, 
  Moon, 
  Sun, 
  Monitor,
  Zap,
  Eye,
  Heart,
  Star,
  Settings,
  Bell,
  Search,
  Plus,
  Download,
  Upload
} from 'lucide-react';
import { useEnhancedTheme } from '../context/EnhancedThemeContext';
import EnhancedCard from '../components/ui/EnhancedCard';
import EnhancedButton from '../components/ui/EnhancedButton';
import EnhancedDarkModeToggle from '../components/EnhancedDarkModeToggle';

const EnhancedDarkModeDemo = () => {
  const { theme, isDark, currentVariant } = useEnhancedTheme();

  const features = [
    {
      icon: Palette,
      title: 'Multiple Dark Variants',
      description: 'Choose from Default, Warm, Cool, or Deep dark modes',
      color: '#3b82f6'
    },
    {
      icon: Sparkles,
      title: 'Glassmorphism Effects',
      description: 'Beautiful frosted glass effects with backdrop blur',
      color: '#8b5cf6'
    },
    {
      icon: Zap,
      title: 'Enhanced Animations',
      description: 'Smooth transitions and micro-interactions',
      color: '#10b981'
    },
    {
      icon: Eye,
      title: 'Better Contrast',
      description: 'Improved readability and accessibility',
      color: '#f59e0b'
    }
  ];

  const stats = [
    { label: 'Dark Variants', value: '4', icon: Moon },
    { label: 'Glass Effects', value: '12+', icon: Sparkles },
    { label: 'Animations', value: '20+', icon: Zap },
    { label: 'Components', value: '15+', icon: Settings }
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl glass-card">
              <Palette className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Enhanced Dark Mode
            </h1>
          </div>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Experience the next generation of dark mode with beautiful variants, glassmorphism effects, and smooth animations
          </p>
          
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <EnhancedDarkModeToggle />
          </div>
          
          {/* Current Theme Info */}
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Current: {theme.mode} mode</span>
            {isDark && currentVariant !== 'default' && (
              <>
                <span>•</span>
                <span>{currentVariant} variant</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <EnhancedCard hover glow className="p-6 text-center h-full">
                  <div className="space-y-4">
                    <div 
                      className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                      style={{ 
                        background: `${feature.color}20`,
                        color: feature.color
                      }}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {feature.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </EnhancedCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <EnhancedCard glass className="p-4 text-center">
                  <div className="space-y-2">
                    <Icon className="w-6 h-6 mx-auto" style={{ color: 'var(--accent-primary)' }} />
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {stat.label}
                    </div>
                  </div>
                </EnhancedCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Component Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            Component Showcase
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buttons */}
            <EnhancedCard className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Enhanced Buttons
              </h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <EnhancedButton variant="primary" glow>Primary</EnhancedButton>
                  <EnhancedButton variant="secondary">Secondary</EnhancedButton>
                  <EnhancedButton variant="success" glow>Success</EnhancedButton>
                  <EnhancedButton variant="warning">Warning</EnhancedButton>
                  <EnhancedButton variant="danger" glow>Danger</EnhancedButton>
                  <EnhancedButton variant="ghost">Ghost</EnhancedButton>
                  <EnhancedButton variant="glass" glow>Glass</EnhancedButton>
                </div>
                <div className="flex flex-wrap gap-3">
                  <EnhancedButton size="sm">Small</EnhancedButton>
                  <EnhancedButton size="md">Medium</EnhancedButton>
                  <EnhancedButton size="lg" glow>Large</EnhancedButton>
                </div>
              </div>
            </EnhancedCard>

            {/* Form Elements */}
            <EnhancedCard glass className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Form Elements
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Enhanced Input
                  </label>
                  <input
                    type="text"
                    placeholder="Type something..."
                    className="w-full enhanced-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Search Input
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full enhanced-input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Select
                  </label>
                  <select className="w-full enhanced-input">
                    <option>Choose an option</option>
                    <option>Option 1</option>
                    <option>Option 2</option>
                  </select>
                </div>
              </div>
            </EnhancedCard>

            {/* Cards with Different Effects */}
            <EnhancedCard className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Card Variants
              </h3>
              <div className="space-y-4">
                <EnhancedCard hover className="p-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" style={{ color: 'var(--accent-danger)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Hover Effect Card</span>
                  </div>
                </EnhancedCard>
                <EnhancedCard glow className="p-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5" style={{ color: 'var(--accent-warning)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Glow Effect Card</span>
                  </div>
                </EnhancedCard>
                <EnhancedCard glass className="p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Glass Effect Card</span>
                  </div>
                </EnhancedCard>
              </div>
            </EnhancedCard>

            {/* Notifications */}
            <EnhancedCard className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </h3>
              <div className="space-y-3">
                <div className="alert alert-success">
                  <Bell className="w-4 h-4" />
                  <span>Success! Your changes have been saved.</span>
                </div>
                <div className="alert alert-warning">
                  <Settings className="w-4 h-4" />
                  <span>Warning: Please review your settings.</span>
                </div>
                <div className="alert alert-danger">
                  <Zap className="w-4 h-4" />
                  <span>Error: Something went wrong.</span>
                </div>
                <div className="alert alert-info">
                  <Eye className="w-4 h-4" />
                  <span>Info: Check out our new features.</span>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center py-8"
        >
          <EnhancedCard glass className="p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ready to Experience Enhanced Dark Mode?
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Switch between themes and variants using the toggle above to see the magic in action!
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <EnhancedButton variant="primary" glow>
                  <Plus className="w-4 h-4 mr-2" />
                  Get Started
                </EnhancedButton>
                <EnhancedButton variant="ghost">
                  <Download className="w-4 h-4 mr-2" />
                  Learn More
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCard>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedDarkModeDemo;
