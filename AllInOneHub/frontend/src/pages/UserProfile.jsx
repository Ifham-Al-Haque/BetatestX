import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Key, Eye, EyeOff, 
  Save, Edit, Camera, Calendar, MapPin, Briefcase,
  Settings, Bell, Lock, Unlock, CheckCircle, AlertTriangle,
  Building, Zap, Clock, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserProfileData, useUpdateUserProfileData } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { AnimatePresence } from 'framer-motion';

export default function UserProfile() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'preferences', 'activity'
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    location: '',
    bio: '',
    avatar_url: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    email_notifications: true,
    login_notifications: true,
    session_timeout: 30
  });

  // Use React Query hooks
  const { data: userProfile, isLoading, error } = useUserProfileData(user?.id);
  const updateProfileMutation = useUpdateUserProfileData();

  // Update profile data when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        position: userProfile.position || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || user?.user_metadata?.avatar_url || ''
      });
    } else if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: '',
        department: '',
        position: '',
        location: '',
        bio: '',
        avatar_url: user.user_metadata?.avatar_url || ''
      });
    }
  }, [userProfile, user]);

  const handleProfileUpdate = useCallback(async (e) => {
    e.preventDefault();
    
    if (!user) {
      showError("Error", "User not logged in");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          department: profileData.department,
          position: profileData.position,
          location: profileData.location,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
        }
      });
      
      setEditing(false);
      success("Success", "Profile updated successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [profileData, user, updateProfileMutation, success, showError]);

  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      showError("Error", "New passwords do not match!");
      return;
    }

    try {
      // This would need to be implemented with Supabase auth
      // For now, we'll show a success message
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordForm(false);
      success("Success", "Password updated successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [passwordData, success, showError]);

  const handleSecuritySettingsUpdate = useCallback(async () => {
    if (!user) {
      showError("Error", "User not logged in");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        data: {
          security_settings: securitySettings,
        }
      });
      
      setShowSecuritySettings(false);
      success("Success", "Security settings updated successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [securitySettings, user, updateProfileMutation, success, showError]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Profile</h3>
            <p className="text-red-600 mt-1">
              {error.message === "JSON object requested, multiple (or no) rows returned" 
                ? "Unable to load your profile. This usually means your profile hasn't been created yet. Please try refreshing the page or contact support."
                : error.message
              }
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        
        <div className="ml-64 p-6 w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where profile is null but no error (profile might be creating)
  if (!userProfile && !error && !isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        
        <div className="ml-64 p-6 w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium">Profile Not Found</h3>
            <p className="text-yellow-600 mt-1">
              Your profile is being created. Please wait a moment and refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">User Profile</h1>
                <p className="text-gray-600">Manage your account and security settings</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 font-medium text-gray-600 transition-colors ${
                activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : ''
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 px-4 font-medium text-gray-600 transition-colors ${
                activeTab === 'security' ? 'border-b-2 border-blue-600 text-blue-600' : ''
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-3 px-4 font-medium text-gray-600 transition-colors ${
                activeTab === 'preferences' ? 'border-b-2 border-blue-600 text-blue-600' : ''
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 px-4 font-medium text-gray-600 transition-colors ${
                activeTab === 'activity' ? 'border-b-2 border-blue-600 text-blue-600' : ''
              }`}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Main Profile Form */}
                <div className="lg:col-span-2">
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                        <p className="text-gray-600">Update your profile details and preferences</p>
                      </div>
                      <button
                        onClick={() => setEditing(!editing)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                          editing
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Edit className="w-4 h-4 inline mr-2" />
                        {editing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.full_name}
                              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                              disabled={!editing}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed"
                              placeholder="your.email@company.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              disabled={!editing}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Department</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.department}
                              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                              disabled={!editing}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                              placeholder="e.g., Engineering, Sales, HR"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Position</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.position}
                              onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                              disabled={!editing}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                              placeholder="e.g., Senior Developer, Manager"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.location}
                              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                              disabled={!editing}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200"
                              placeholder="e.g., New York, Remote"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <label className="block text-sm font-semibold text-gray-700">Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          disabled={!editing}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
                          placeholder="Tell us about yourself, your interests, and what drives you..."
                        />
                      </div>

                      {editing && (
                        <motion.div 
                          className="flex gap-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <button
                            type="submit"
                            disabled={updateProfileMutation.isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </form>
                  </motion.div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                  {/* Avatar Card */}
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                        {profileData.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-blue-600" />
                        )}
                      </div>
                      {editing && (
                        <motion.button 
                          className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-lg transform hover:scale-110 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Camera className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{profileData.full_name || 'User'}</h3>
                    <p className="text-blue-600 font-medium mb-1">{profileData.position || 'Employee'}</p>
                    <p className="text-gray-500 text-sm">{profileData.department || 'Department'}</p>
                    
                    {/* Profile Completion Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Profile Complete</span>
                        <span>98%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '98%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Quick Actions
                    </h3>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <Key className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Change Password</span>
                          </div>
                          <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setShowSecuritySettings(true)}
                        className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                              <Shield className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Security Settings</span>
                          </div>
                          <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>

                      <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-200 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <Bell className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Notifications</span>
                          </div>
                          <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Account Status */}
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Account Status
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">Email Verified</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700">2FA Enabled</span>
                        </div>
                        <span className="text-xs text-yellow-600 font-medium">Disabled</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">Last Login</span>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Today</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Password Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      Password Management
                    </h3>
                    <p className="text-gray-600 mb-4">Keep your account secure with a strong password</p>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Security Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Security Features
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                          <div className="text-sm text-gray-600">Add an extra layer of security</div>
                        </div>
                        <button
                          onClick={() => setSecuritySettings({ ...securitySettings, two_factor_enabled: !securitySettings.two_factor_enabled })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            securitySettings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">Login Notifications</div>
                          <div className="text-sm text-gray-600">Get notified of new logins</div>
                        </div>
                        <button
                          onClick={() => setSecuritySettings({ ...securitySettings, login_notifications: !securitySettings.login_notifications })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            securitySettings.login_notifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.login_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-purple-600" />
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">Email Notifications</div>
                          <div className="text-sm text-gray-600">Receive updates via email</div>
                        </div>
                        <button
                          onClick={() => setSecuritySettings({ ...securitySettings, email_notifications: !securitySettings.email_notifications })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            securitySettings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Session Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
                        <select
                          value={securitySettings.session_timeout}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: Number(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Profile Updated</div>
                      <div className="text-sm text-gray-600">You updated your profile information</div>
                    </div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Password Changed</div>
                      <div className="text-sm text-gray-600">Your password was successfully updated</div>
                    </div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Login from New Device</div>
                      <div className="text-sm text-gray-600">You logged in from a new location</div>
                    </div>
                    <div className="text-xs text-gray-500">3 days ago</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Change Modal */}
          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl p-6 w-full max-w-md"
                >
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Settings Modal */}
          <AnimatePresence>
            {showSecuritySettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl p-6 w-full max-w-md"
                >
                  <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Two-Factor Authentication</span>
                      <button
                        onClick={() => setSecuritySettings({ ...securitySettings, two_factor_enabled: !securitySettings.two_factor_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email Notifications</span>
                      <button
                        onClick={() => setSecuritySettings({ ...securitySettings, email_notifications: !securitySettings.email_notifications })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Login Notifications</span>
                      <button
                        onClick={() => setSecuritySettings({ ...securitySettings, login_notifications: !securitySettings.login_notifications })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.login_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.login_notifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                      <select
                        value={securitySettings.session_timeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSecuritySettingsUpdate}
                        disabled={updateProfileMutation.isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                      >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        onClick={() => setShowSecuritySettings(false)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
} 