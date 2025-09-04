import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Search, Filter, Plus, Bell, User, 
  Home, FileText, BarChart3, Settings, LogOut,
  ChevronDown, ChevronUp, Calendar, Clock, 
  AlertCircle, CheckCircle, XCircle, Activity,
  Download, Share, Star, Heart, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/button';
import Label from '../components/ui/label';

const MobileOptimized = ({ children, currentPage }) => {
  const { user, userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();
  
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      if (result.outcome === 'accepted') {
        success('Success', 'App installed successfully!');
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'IT Service Management',
          text: 'Check out our IT Service Management app',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      success('Success', 'Link copied to clipboard!');
    }
  };

  const mobileMenuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', active: currentPage === 'dashboard' },
    { name: 'IT Requests', icon: FileText, path: '/it-requests', active: currentPage === 'it-requests' },
    { name: 'Request Inbox', icon: FileText, path: '/request-inbox', active: currentPage === 'request-inbox' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', active: currentPage === 'analytics' },
    { name: 'Settings', icon: Settings, path: '/settings', active: currentPage === 'settings' }
  ];

  return (
    <div className="mobile-optimized">
      {/* Mobile Header */}
      <motion.div 
        className="mobile-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          background: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="p-2"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                IT Service
              </h1>
              <p 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!isSearchOpen)}
              className="p-2"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterOpen(!isFilterOpen)}
              className="p-2"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <Filter className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-80 z-50"
              style={{
                background: 'var(--card-bg)',
                borderRight: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 
                      className="text-xl font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      IT Service
                    </h2>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Management System
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuOpen(false)}
                    className="p-2"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg mb-6" style={{ background: 'var(--bg-tertiary)' }}>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p 
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {userProfile?.full_name || user?.email}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {userProfile?.role || 'User'}
                    </p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {mobileMenuItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3"
                        style={{
                          background: item.active ? 'var(--accent-primary)' : 'transparent',
                          color: item.active ? 'white' : 'var(--text-primary)'
                        }}
                        onClick={() => {
                          // Navigate to item.path
                          setMenuOpen(false);
                        }}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <h3 
                    className="text-sm font-medium mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start p-3"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                      onClick={() => {
                        // Navigate to new request
                        setMenuOpen(false);
                      }}
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      <span>New Request</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start p-3"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                      onClick={handleShare}
                    >
                      <Share className="w-5 h-5 mr-3" />
                      <span>Share App</span>
                    </Button>
                    
                    {installPrompt && !isInstalled && (
                      <Button
                        variant="outline"
                        className="w-full justify-start p-3"
                        style={{
                          background: 'var(--bg-tertiary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                        onClick={handleInstall}
                      >
                        <Download className="w-5 h-5 mr-3" />
                        <span>Install App</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onClick={toggleTheme}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      <span>Toggle Theme</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onClick={logout}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40"
            style={{
              background: 'var(--card-bg)',
              borderTop: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterOpen(false)}
                  className="p-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label 
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Status
                  </Label>
                  <select
                    className="w-full p-3 rounded-lg border"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <Label 
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Priority
                  </Label>
                  <select
                    className="w-full p-3 rounded-lg border"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    className="flex-1"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="mobile-content" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.div 
        className="mobile-bottom-nav"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center justify-around py-2">
          {mobileMenuItems.slice(0, 4).map((item, index) => (
            <Button
              key={item.name}
              variant="ghost"
              className="flex flex-col items-center p-2"
              style={{
                background: item.active ? 'var(--accent-primary)' : 'transparent',
                color: item.active ? 'white' : 'var(--text-muted)'
              }}
              onClick={() => {
                // Navigate to item.path
              }}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-30"
            style={{
              background: 'var(--accent-warning)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt */}
      <AnimatePresence>
        {installPrompt && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-30"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Install IT Service App</h4>
                <p className="text-sm opacity-90">Get quick access and offline support</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInstallPrompt(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Install
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileOptimized;
