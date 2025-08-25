import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Menu, 
  X, 
  User,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';

const WelcomeNavbar = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      await signOut();
      console.log('Sign out completed, navigating to home...');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">UDrive</h1>
              <p className="text-[#2FF9B5] text-xs font-medium">Hub</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              // Logged in user navigation
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleProfile}
                  className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium"
                >
                  Profile
                </button>
                <button
                  onClick={handleSettings}
                  className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium"
                >
                  Settings
                </button>
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{userProfile?.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{userProfile?.role || user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Non-logged in user navigation
              <>
                <button className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium">
                  Features
                </button>
                <button className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium">
                  About
                </button>
                <button className="text-gray-600 hover:text-[#2FF9B5] transition-colors font-medium">
                  Contact
                </button>
                <button
                  onClick={handleLogin}
                  className="px-6 py-2 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] text-white rounded-xl hover:from-[#2562CF] hover:to-[#2FF9B5] transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-6 space-y-4">
            {user ? (
              // Logged in user mobile navigation
              <>
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    handleProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    handleSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  Settings
                </button>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-3 px-4 py-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{userProfile?.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{userProfile?.role || user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              // Non-logged in user mobile navigation
              <>
                <button className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium">
                  Features
                </button>
                <button className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium">
                  About
                </button>
                <button className="block w-full text-left px-4 py-3 text-gray-600 hover:text-[#2FF9B5] hover:bg-gray-50 rounded-lg transition-colors font-medium">
                  Contact
                </button>
                <button
                  onClick={() => {
                    handleLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] text-white rounded-xl font-semibold text-center"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default WelcomeNavbar;
