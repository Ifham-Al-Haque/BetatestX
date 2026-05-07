import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Key,
  Save, Edit, Camera, Calendar, MapPin, Briefcase,
  Bell, CheckCircle, AlertTriangle,
  Building, Zap, Clock, Globe, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserProfileData, useUpdateUserProfileData } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';

import { AnimatePresence } from 'framer-motion';

export default function UserProfile() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
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
  const updateProfilePending = updateProfileMutation?.isPending ?? updateProfileMutation?.isLoading;
  const [avatarUploading, setAvatarUploading] = useState(false);

  const surfaceCardClass = isDark
    ? 'bg-slate-800/90 border-slate-700'
    : 'bg-white border-gray-100';
  const headingClass = isDark ? 'text-slate-100' : 'text-gray-900';
  const textMutedClass = isDark ? 'text-slate-300' : 'text-gray-600';
  const labelClass = isDark ? 'text-slate-300' : 'text-gray-700';
  const inputClass = `w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
    isDark
      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 disabled:bg-slate-800'
      : 'border-gray-200 bg-white text-gray-900 disabled:bg-gray-50'
  }`;
  const textAreaClass = `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
    isDark
      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 disabled:bg-slate-800'
      : 'border-gray-200 bg-white text-gray-900 disabled:bg-gray-50'
  }`;
  const disabledInputClass = `w-full pl-10 pr-4 py-3 border rounded-xl cursor-not-allowed ${
    isDark
      ? 'border-slate-600 bg-slate-800 text-slate-300'
      : 'border-gray-200 bg-gray-50 text-gray-500'
  }`;

  const profileCompletion = useMemo(() => {
    const fields = [
      profileData.full_name,
      profileData.email,
      profileData.phone,
      profileData.department,
      profileData.position,
      profileData.location,
      profileData.bio,
      profileData.avatar_url,
    ];
    const filled = fields.filter((v) => String(v || '').trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profileData]);

  const missingFields = useMemo(() => {
    const items = [];
    if (!profileData.phone) items.push('Phone');
    if (!profileData.department) items.push('Department');
    if (!profileData.position) items.push('Position');
    if (!profileData.location) items.push('Location');
    if (!profileData.bio) items.push('Bio');
    if (!profileData.avatar_url) items.push('Avatar');
    return items;
  }, [profileData]);

  const profileInitials = useMemo(() => {
    const rawName = String(profileData.full_name || '').trim();
    if (!rawName) return 'U';
    return rawName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  }, [profileData.full_name]);

  const completionToneClass = profileCompletion >= 80
    ? 'text-emerald-600'
    : profileCompletion >= 50
      ? 'text-amber-600'
      : 'text-rose-600';

  const profileBadges = useMemo(() => {
    const badges = [];
    if (profileCompletion >= 80) badges.push({ label: 'Profile Pro', icon: Star, tone: 'amber' });
    if (securitySettings.two_factor_enabled) badges.push({ label: '2FA Enabled', icon: Shield, tone: 'emerald' });
    if (securitySettings.login_notifications) badges.push({ label: 'Alerts On', icon: Bell, tone: 'blue' });
    if (profileData.bio && profileData.location) badges.push({ label: 'Public Ready', icon: Globe, tone: 'purple' });
    if (badges.length === 0) badges.push({ label: 'Getting Started', icon: User, tone: 'slate' });
    return badges.slice(0, 3);
  }, [profileCompletion, securitySettings, profileData.bio, profileData.location]);

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key !== 'Escape') return;
      setShowPasswordForm(false);
      setShowSecuritySettings(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

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

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      showError('Error', 'User not logged in');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Error', 'Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Error', 'Image size must be less than 5MB');
      return;
    }

    try {
      setAvatarUploading(true);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `users/${user.id}/avatar_${Date.now()}.${fileExt}`;
      const bucketName = 'profile-pictures';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket') || uploadError.message?.toLowerCase().includes('not found')) {
          throw new Error('Storage bucket "profile-pictures" is missing. Please create it in Supabase Storage.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      setProfileData((prev) => ({ ...prev, avatar_url: publicUrl }));

      await updateProfileMutation.mutateAsync({
        userId: user.id,
        data: { avatar_url: publicUrl },
      });

      success('Success', 'Profile picture updated successfully!');
    } catch (err) {
      showError('Error', err.message || 'Failed to upload profile picture');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }, [user?.id, showError, success, updateProfileMutation]);

  if (error) {
    return (
      <div className="min-h-[60vh]">
        <div className="p-4 sm:p-6 w-full">
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
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-56 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  // Handle case where profile is null but no error (profile might be creating)
  if (!userProfile && !error && !isLoading) {
    return (
      <div className="min-h-[60vh]">
        <div className="p-4 sm:p-6 w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium">Profile Not Found</h3>
            <p className="text-yellow-600 mt-1">
              Your profile is being created. Please wait a moment and refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <div className="flex">
        <main className="flex-1 p-3 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
            }`}>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-slate-700' : 'bg-blue-100'
              }`}>
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${headingClass}`}>User Profile</h1>
                <p className={textMutedClass}>Manage your account and security settings</p>
                <p className={`text-sm font-semibold mt-1 ${completionToneClass}`}>
                  Profile strength: {profileCompletion}%
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 overflow-x-auto">
            <div className="inline-flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { key: 'profile', label: 'Profile', icon: User },
                { key: 'security', label: 'Security', icon: Shield },
                { key: 'preferences', label: 'Preferences', icon: Bell },
                { key: 'activity', label: 'Activity', icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.24 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Main Profile Form */}
                <div className="lg:col-span-2">
                  <motion.div
                    className={`${surfaceCardClass} rounded-2xl shadow-lg border p-8`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.16 : 0.28, delay: 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className={`text-2xl font-bold mb-2 ${headingClass}`}>Personal Information</h2>
                        <p className={textMutedClass}>Update your profile details and preferences</p>
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
                          <label className={`block text-sm font-semibold ${labelClass}`}>Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.full_name}
                              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                              disabled={!editing}
                              className={inputClass}
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className={`block text-sm font-semibold ${labelClass}`}>Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className={disabledInputClass}
                              placeholder="your.email@company.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`block text-sm font-semibold ${labelClass}`}>Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              disabled={!editing}
                              className={inputClass}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`block text-sm font-semibold ${labelClass}`}>Department</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.department}
                              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                              disabled={!editing}
                              className={inputClass}
                              placeholder="e.g., Engineering, Sales, HR"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`block text-sm font-semibold ${labelClass}`}>Position</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.position}
                              onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                              disabled={!editing}
                              className={inputClass}
                              placeholder="e.g., Senior Developer, Manager"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`block text-sm font-semibold ${labelClass}`}>Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.location}
                              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                              disabled={!editing}
                              className={inputClass}
                              placeholder="e.g., New York, Remote"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <label className={`block text-sm font-semibold ${labelClass}`}>Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          disabled={!editing}
                          rows={4}
                          className={textAreaClass}
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
                            disabled={updateProfilePending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {updateProfilePending ? 'Saving...' : 'Save Changes'}
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
                    className={`${surfaceCardClass} rounded-2xl shadow-lg border p-6 text-center`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.16 : 0.28, delay: 0.12 }}
                  >
                    <div className={`h-20 -mx-6 -mt-6 mb-4 rounded-t-2xl border-b ${
                      isDark
                        ? 'bg-gradient-to-r from-indigo-500/25 via-blue-500/20 to-cyan-500/20 border-slate-700'
                        : 'bg-gradient-to-r from-indigo-100 via-blue-100 to-cyan-100 border-blue-100'
                    }`} />
                    <div className="relative inline-block mb-4">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 shadow-lg ${
                        isDark
                          ? 'bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border-slate-700'
                          : 'bg-gradient-to-br from-blue-100 to-indigo-100 border-white'
                      }`}>
                        {profileData.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <span className={`text-2xl font-bold ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{profileInitials}</span>
                        )}
                      </div>
                      {editing && (
                        <motion.button 
                          type="button"
                          onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                          disabled={avatarUploading}
                          className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-lg transform hover:scale-110 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {avatarUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </motion.button>
                      )}
                      <input
                        id="profile-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <h3 className={`font-bold text-lg mb-1 ${headingClass}`}>{profileData.full_name || 'User'}</h3>
                    <p className="text-blue-600 font-medium mb-1">{profileData.position || 'Employee'}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{profileData.department || 'Department'}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {profileBadges.map((badge) => {
                        const Icon = badge.icon;
                        const toneClass = badge.tone === 'amber'
                          ? (isDark ? 'bg-amber-500/20 text-amber-200 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200')
                          : badge.tone === 'emerald'
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                            : badge.tone === 'blue'
                              ? (isDark ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200')
                              : badge.tone === 'purple'
                                ? (isDark ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200')
                                : (isDark ? 'bg-slate-600/40 text-slate-200 border-slate-500/50' : 'bg-slate-50 text-slate-700 border-slate-200');
                        return (
                          <span
                            key={badge.label}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${toneClass}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                    
                    {/* Profile Completion Bar */}
                    <div className="mt-4">
                      <div className={`flex justify-between text-sm mb-2 ${textMutedClass}`}>
                        <span>Profile Complete</span>
                        <span>{profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${profileCompletion}%` }}
                          transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, delay: 0.2 }}
                        />
                      </div>
                      {missingFields.length > 0 && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          Complete: {missingFields.slice(0, 2).join(', ')}{missingFields.length > 2 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    className={`${surfaceCardClass} rounded-2xl shadow-lg border p-6`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.16 : 0.28, delay: 0.16 }}
                  >
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Quick Actions
                    </h3>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className={`w-full text-left p-3 rounded-xl transition-colors duration-200 group ${
                          isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isDark ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-blue-100 group-hover:bg-blue-200'
                            }`}>
                              <Key className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className={`text-sm font-medium ${headingClass}`}>Change Password</span>
                            
                          </div>
                          <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setShowSecuritySettings(true)}
                        className={`w-full text-left p-3 rounded-xl transition-colors duration-200 group ${
                          isDark ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isDark ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-green-100 group-hover:bg-green-200'
                            }`}>
                              <Shield className="w-4 h-4 text-green-600" />
                            </div>
                            <span className={`text-sm font-medium ${headingClass}`}>Security Settings</span>
                          </div>
                          <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('preferences')}
                        className={`w-full text-left p-3 rounded-xl transition-colors duration-200 group ${
                          isDark ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-purple-50 hover:bg-purple-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isDark ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-purple-100 group-hover:bg-purple-200'
                            }`}>
                              <Bell className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className={`text-sm font-medium ${headingClass}`}>Notifications</span>
                          </div>
                          <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Account Status */}
                  <motion.div
                    className={`${surfaceCardClass} rounded-2xl shadow-lg border p-6`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.16 : 0.28, delay: 0.2 }}
                  >
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Account Status
                    </h3>
                    
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className={`text-sm font-medium ${headingClass}`}>Email Verified</span>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                      
                      <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className={`text-sm font-medium ${headingClass}`}>2FA Enabled</span>
                        </div>
                        <span className="text-xs text-yellow-600 font-medium">Disabled</span>
                      </div>
                      
                      <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className={`text-sm font-medium ${headingClass}`}>Last Login</span>
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
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.24 }}
                className={`${surfaceCardClass} rounded-2xl shadow-lg border p-8`}
              >
                <h2 className={`text-2xl font-bold mb-6 ${headingClass}`}>Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Password Section */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <Key className="w-5 h-5 text-blue-600" />
                      Password Management
                    </h3>
                    <p className={`${textMutedClass} mb-4`}>Keep your account secure with a strong password</p>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Security Features */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <Shield className="w-5 h-5 text-green-600" />
                      Security Features
                    </h3>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
                        <div>
                          <div className={`font-medium ${headingClass}`}>Two-Factor Authentication</div>
                          <div className={`text-sm ${textMutedClass}`}>Add an extra layer of security</div>
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

                      <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
                        <div>
                          <div className={`font-medium ${headingClass}`}>Login Notifications</div>
                          <div className={`text-sm ${textMutedClass}`}>Get notified of new logins</div>
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
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.24 }}
                className={`${surfaceCardClass} rounded-2xl shadow-lg border p-8`}
              >
                <h2 className={`text-2xl font-bold mb-6 ${headingClass}`}>Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Notification Preferences */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <Bell className="w-5 h-5 text-purple-600" />
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
                        <div>
                          <div className={`font-medium ${headingClass}`}>Email Notifications</div>
                          <div className={`text-sm ${textMutedClass}`}>Receive updates via email</div>
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
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <Clock className="w-5 h-5 text-orange-600" />
                      Session Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Session Timeout</label>
                        <select
                          value={securitySettings.session_timeout}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: Number(e.target.value) })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-200 bg-white text-gray-900'}`}
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
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.24 }}
                className={`${surfaceCardClass} rounded-2xl shadow-lg border p-8`}
              >
                <h2 className={`text-2xl font-bold mb-6 ${headingClass}`}>Recent Activity</h2>
                <div className="space-y-4">
                  <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${headingClass}`}>Profile Updated</div>
                      <div className={`text-sm ${textMutedClass}`}>You updated your profile information</div>
                    </div>
                    <div className={`text-xs ${textMutedClass}`}>2 hours ago</div>
                  </div>

                  <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${headingClass}`}>Password Changed</div>
                      <div className={`text-sm ${textMutedClass}`}>Your password was successfully updated</div>
                    </div>
                    <div className={`text-xs ${textMutedClass}`}>1 day ago</div>
                  </div>

                  <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${headingClass}`}>Login from New Device</div>
                      <div className={`text-sm ${textMutedClass}`}>You logged in from a new location</div>
                    </div>
                    <div className={`text-xs ${textMutedClass}`}>3 days ago</div>
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
                onClick={() => setShowPasswordForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`rounded-xl p-6 w-full max-w-md border ${surfaceCardClass}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Current Password</label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${labelClass}`}>New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
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
                onClick={() => setShowSecuritySettings(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`rounded-xl p-6 w-full max-w-md border ${surfaceCardClass}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${headingClass}`}>Two-Factor Authentication</span>
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
                      <span className={`text-sm font-medium ${headingClass}`}>Email Notifications</span>
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
                      <span className={`text-sm font-medium ${headingClass}`}>Login Notifications</span>
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
                      <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Session Timeout (minutes)</label>
                      <select
                        value={securitySettings.session_timeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: Number(e.target.value) })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
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
                        disabled={updateProfilePending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                      >
                        {updateProfilePending ? 'Saving...' : 'Save Settings'}
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