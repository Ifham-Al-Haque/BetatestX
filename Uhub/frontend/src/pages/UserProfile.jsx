import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Key,
  Save, Edit, Camera, MapPin, Briefcase,
  Bell, CheckCircle, AlertTriangle,
  Building, Zap, Clock, Globe, Star, Eye, EyeOff,
  ExternalLink, Sun, Moon, Monitor, ClipboardList,
  Loader2, Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserProfileData, useUpdateUserProfileData } from '../hooks/useApi';
import { useTaskSidebarCounts } from '../hooks/useTaskSidebarCounts';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import activityService from '../services/activityService';
import { loadUserPreferences, saveUserPreferences } from '../utils/userPreferences';
import { formatTimeAgo, formatDateTime } from '../utils/formatTimeAgo';
import { hasFeatureAccess } from '../components/RoleBasedRoute';

const VALID_TABS = ['profile', 'security', 'preferences', 'activity'];

const ROLE_STYLES = {
  admin: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  hr_manager: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
  manager: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  employee: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
};

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

function getActivityMeta(action = '') {
  const key = String(action).toLowerCase();
  if (key.includes('login')) return { icon: Shield, tone: 'green' };
  if (key.includes('password')) return { icon: Key, tone: 'blue' };
  if (key.includes('profile')) return { icon: User, tone: 'blue' };
  if (key.includes('export')) return { icon: Globe, tone: 'purple' };
  return { icon: Clock, tone: 'slate' };
}

function ToggleSwitch({ enabled, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function UserProfile() {
  const { user, userProfile: authProfile } = useAuth();
  const { isDark, preference, setThemePreference } = useTheme();
  const { success, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const editSnapshotRef = useRef(null);

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'profile';
  const setActiveTab = useCallback(
    (tab) => setSearchParams({ tab }, { replace: true }),
    [setSearchParams]
  );

  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    location: '',
    bio: '',
    avatar_url: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [preferences, setPreferences] = useState(() => loadUserPreferences(user?.id));
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const { data: userProfile, isLoading, error } = useUserProfileData(user?.id);
  const updateProfileMutation = useUpdateUserProfileData();
  const updateProfilePending = updateProfileMutation?.isPending ?? updateProfileMutation?.isLoading;
  const [avatarUploading, setAvatarUploading] = useState(false);

  const employeeId = userProfile?.employee_id || authProfile?.employeeId || null;
  const isHrLinked = Boolean(employeeId);
  const role = userProfile?.role || authProfile?.role || 'employee';
  const canViewEmployeeProfile = isHrLinked && hasFeatureAccess(role, 'employees');

  const { data: taskCounts } = useTaskSidebarCounts();

  const surfaceCardClass =
    'rounded-2xl border shadow-sm bg-[var(--surface-raised)] border-[var(--border-primary)]';
  const headingClass = 'text-content-primary';
  const textMutedClass = 'text-content-muted';
  const labelClass = 'text-content-secondary';
  const inputClass =
    'w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-[var(--border-primary)] bg-[var(--surface-base)] text-content-primary placeholder:text-content-muted disabled:opacity-60 disabled:cursor-not-allowed';
  const textAreaClass =
    'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none border-[var(--border-primary)] bg-[var(--surface-base)] text-content-primary placeholder:text-content-muted disabled:opacity-60';
  const disabledInputClass =
    'w-full pl-10 pr-4 py-3 border rounded-xl cursor-not-allowed border-[var(--border-primary)] bg-[var(--surface-overlay)] text-content-muted';

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
    return (
      rawName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'U'
    );
  }, [profileData.full_name]);

  const completionToneClass =
    profileCompletion >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : profileCompletion >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  const profileBadges = useMemo(() => {
    const badges = [];
    if (profileCompletion >= 80) badges.push({ label: 'Profile Pro', icon: Star, tone: 'amber' });
    if (mfaEnabled) badges.push({ label: '2FA Enabled', icon: Shield, tone: 'emerald' });
    if (preferences.login_notifications) badges.push({ label: 'Alerts On', icon: Bell, tone: 'blue' });
    if (profileData.bio && profileData.location) badges.push({ label: 'Public Ready', icon: Globe, tone: 'purple' });
    if (badges.length === 0) badges.push({ label: 'Getting Started', icon: User, tone: 'slate' });
    return badges.slice(0, 3);
  }, [profileCompletion, mfaEnabled, preferences.login_notifications, profileData.bio, profileData.location]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData.new_password),
    [passwordData.new_password]
  );

  const emailVerified = Boolean(user?.email_confirmed_at);
  const lastLogin = user?.last_sign_in_at;

  useEffect(() => {
    if (user?.id) {
      setPreferences(loadUserPreferences(user.id));
    }
  }, [user?.id]);

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === 'Escape') setShowPasswordForm(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    supabase.auth.mfa
      .listFactors()
      .then(({ data }) => {
        const totpCount = data?.totp?.filter((f) => f.status === 'verified')?.length || 0;
        setMfaEnabled(totpCount > 0);
      })
      .catch(() => setMfaEnabled(false));
  }, [user?.id]);

  useEffect(() => {
    if (!userProfile && !user) return;

    const base = {
      full_name: userProfile?.full_name || user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: userProfile?.phone || '',
      department: userProfile?.department || authProfile?.department || '',
      position: userProfile?.position || authProfile?.position || '',
      location: userProfile?.location || '',
      bio: userProfile?.bio || '',
      avatar_url: userProfile?.avatar_url || user?.user_metadata?.avatar_url || '',
    };

    setProfileData(base);
  }, [userProfile, user, authProfile?.department, authProfile?.position]);

  useEffect(() => {
    if (!employeeId) return;

    supabase
      .from('employees')
      .select('department, position, full_name')
      .eq('id', employeeId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfileData((prev) => ({
          ...prev,
          department: data.department || prev.department,
          position: data.position || prev.position,
          full_name: prev.full_name || data.full_name || prev.full_name,
        }));
      });
  }, [employeeId]);

  useEffect(() => {
    if (activeTab !== 'activity' || !user?.id) return;

    let cancelled = false;
    setActivityLoading(true);

    activityService
      .getActivityLogs({ userId: user.id, limit: 20 })
      .then(({ data }) => {
        if (!cancelled) setActivityLogs(data || []);
      })
      .catch(() => {
        if (!cancelled) setActivityLogs([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, user?.id]);

  const startEditing = useCallback(() => {
    editSnapshotRef.current = { ...profileData };
    setEditing(true);
  }, [profileData]);

  const cancelEditing = useCallback(() => {
    if (editSnapshotRef.current) {
      setProfileData(editSnapshotRef.current);
    }
    setEditing(false);
  }, []);

  const handleProfileUpdate = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user) {
        showError('Error', 'User not logged in');
        return;
      }

      const payload = {
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      };

      if (!isHrLinked) {
        payload.department = profileData.department;
        payload.position = profileData.position;
      }

      try {
        await updateProfileMutation.mutateAsync({ userId: user.id, data: payload });
        await activityService.logActivity('profile_update', 'Updated profile information', {
          resourceType: 'user_profile',
        });
        setEditing(false);
        editSnapshotRef.current = null;
        success('Success', 'Profile updated successfully!');
      } catch (err) {
        showError('Error', err.message);
      }
    },
    [profileData, user, isHrLinked, updateProfileMutation, success, showError]
  );

  const handlePasswordChange = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user?.email) {
        showError('Error', 'User not logged in');
        return;
      }

      if (!passwordData.current_password) {
        showError('Error', 'Please enter your current password.');
        return;
      }

      if (passwordData.new_password.length < 8) {
        showError('Error', 'New password must be at least 8 characters long.');
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        showError('Error', 'New passwords do not match!');
        return;
      }

      if (passwordData.current_password === passwordData.new_password) {
        showError('Error', 'New password must be different from current password.');
        return;
      }

      try {
        setPasswordUpdating(true);

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordData.current_password,
        });

        if (verifyError) throw new Error('Current password is incorrect.');

        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordData.new_password,
        });

        if (updateError) throw updateError;

        await activityService.logActivity('password_change', 'Password updated successfully', {
          resourceType: 'user_profile',
        });

        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordForm(false);
        success('Success', 'Password updated successfully!');
      } catch (err) {
        showError('Error', err.message || 'Unable to update password.');
      } finally {
        setPasswordUpdating(false);
      }
    },
    [passwordData, success, showError, user?.email]
  );

  const handlePreferencesSave = useCallback(async () => {
    if (!user?.id) {
      showError('Error', 'User not logged in');
      return;
    }

    setPrefsSaving(true);
    try {
      saveUserPreferences(user.id, preferences);
      success('Success', 'Preferences saved successfully!');
    } catch (err) {
      showError('Error', err.message || 'Unable to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  }, [preferences, user?.id, success, showError]);

  const handleAvatarUpload = useCallback(
    async (e) => {
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
          if (
            uploadError.message?.toLowerCase().includes('bucket') ||
            uploadError.message?.toLowerCase().includes('not found')
          ) {
            throw new Error(
              'Storage bucket "profile-pictures" is missing. Please create it in Supabase Storage.'
            );
          }
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

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
    },
    [user?.id, showError, success, updateProfileMutation]
  );

  const roleBadgeClass = ROLE_STYLES[role] || ROLE_STYLES.employee;

  if (error) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <h3 className="text-red-800 dark:text-red-300 font-medium">Error Loading Profile</h3>
          <p className="text-red-600 dark:text-red-400 mt-1">
            {error.message === 'JSON object requested, multiple (or no) rows returned'
              ? "Unable to load your profile. Please try refreshing or contact support."
              : error.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 rounded-2xl bg-[var(--surface-overlay)]" />
            <div className="h-64 rounded-2xl bg-[var(--surface-overlay)]" />
          </div>
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-[var(--surface-overlay)]" />
            <div className="h-40 rounded-2xl bg-[var(--surface-overlay)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile && !error && !isLoading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
          <h3 className="text-amber-800 dark:text-amber-300 font-medium">Profile Not Found</h3>
          <p className="text-amber-700 dark:text-amber-400 mt-1">
            Your profile is being created. Please wait a moment and refresh the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'preferences', label: 'Preferences', icon: Palette },
    { key: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <div className="min-h-screen font-sans">
      <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          className={`${surfaceCardClass} overflow-hidden mb-8`}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="h-28 sm:h-36 relative"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <div className="px-6 pb-6 -mt-14 sm:-mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--surface-raised)] shadow-lg overflow-hidden bg-[var(--surface-overlay)] flex items-center justify-center">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {profileInitials}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
                  aria-label="Upload profile photo"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className={`text-2xl sm:text-3xl font-bold truncate ${headingClass}`}>
                    {profileData.full_name || 'User'}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleBadgeClass}`}
                  >
                    {role.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-content-secondary text-sm sm:text-base">
                  {profileData.position || 'Team member'}
                  {profileData.department ? ` · ${profileData.department}` : ''}
                </p>
                <p className={`text-sm font-semibold mt-2 ${completionToneClass}`}>
                  Profile strength: {profileCompletion}%
                </p>
              </div>

              <div className="flex gap-2 sm:pb-1">
                {canViewEmployeeProfile && (
                  <Link
                    to={`/employee/${employeeId}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-primary)] text-content-primary hover:bg-[var(--surface-overlay)] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Employee record
                  </Link>
                )}
                {!editing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div
            className="inline-flex gap-1 p-1 rounded-xl border border-[var(--border-primary)]"
            style={{ background: 'var(--surface-overlay)' }}
            role="tablist"
          >
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--surface-raised)] text-blue-600 shadow-sm'
                      : 'text-content-muted hover:text-content-primary hover:bg-[var(--surface-raised)]/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              <div className="lg:col-span-2">
                <div className={`${surfaceCardClass} p-6 sm:p-8`}>
                  <div className="mb-6">
                    <h2 className={`text-xl font-bold ${headingClass}`}>Personal Information</h2>
                    <p className={`text-sm mt-1 ${textMutedClass}`}>
                      {isHrLinked
                        ? 'Department and position are managed in your employee record.'
                        : 'Update your profile details and preferences.'}
                    </p>
                  </div>

                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div className="space-y-2">
                        <label className={`block text-sm font-semibold ${labelClass}`}>Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
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
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className={disabledInputClass}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-sm font-semibold ${labelClass}`}>Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            disabled={!editing}
                            className={inputClass}
                            placeholder="+971 XX XXX XXXX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-sm font-semibold ${labelClass}`}>
                          Department
                          {isHrLinked && (
                            <span className="ml-2 text-xs font-normal text-content-muted">(from HR)</span>
                          )}
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                          <input
                            type="text"
                            value={profileData.department}
                            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            disabled={!editing || isHrLinked}
                            className={inputClass}
                            placeholder="Department"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-sm font-semibold ${labelClass}`}>
                          Position
                          {isHrLinked && (
                            <span className="ml-2 text-xs font-normal text-content-muted">(from HR)</span>
                          )}
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                          <input
                            type="text"
                            value={profileData.position}
                            onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                            disabled={!editing || isHrLinked}
                            className={inputClass}
                            placeholder="Position"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={`block text-sm font-semibold ${labelClass}`}>Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            disabled={!editing}
                            className={inputClass}
                            placeholder="e.g., Dubai, Remote"
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
                        placeholder="Tell colleagues a bit about yourself..."
                      />
                    </div>

                    {editing && (
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={updateProfilePending}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {updateProfilePending ? 'Saving...' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-6 py-3 rounded-xl font-medium border border-[var(--border-primary)] text-content-secondary hover:bg-[var(--surface-overlay)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="space-y-6">
                {/* Completion card */}
                <div className={`${surfaceCardClass} p-6 text-center`}>
                  <h3 className={`font-bold text-lg mb-3 ${headingClass}`}>Profile overview</h3>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    {profileBadges.map((badge) => {
                      const Icon = badge.icon;
                      const toneClass =
                        badge.tone === 'amber'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : badge.tone === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : badge.tone === 'blue'
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : badge.tone === 'purple'
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                : 'bg-[var(--surface-overlay)] text-content-secondary border-[var(--border-primary)]';
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
                  <div className={`flex justify-between text-sm mb-2 ${textMutedClass}`}>
                    <span>Profile complete</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 bg-[var(--surface-overlay)]">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompletion}%` }}
                      transition={{ duration: prefersReducedMotion ? 0.2 : 0.6 }}
                    />
                  </div>
                  {missingFields.length > 0 && (
                    <p className={`text-xs mt-2 ${textMutedClass}`}>
                      Add: {missingFields.slice(0, 3).join(', ')}
                      {missingFields.length > 3 ? '…' : ''}
                    </p>
                  )}
                  {userProfile?.created_at && (
                    <p className={`text-xs mt-3 ${textMutedClass}`}>
                      Member since {formatDateTime(userProfile.created_at).split(',')[0]}
                    </p>
                  )}
                </div>

                {/* Quick actions */}
                <div className={`${surfaceCardClass} p-6`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headingClass}`}>
                    <Zap className="w-5 h-5 text-amber-500" />
                    Quick actions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Change password', icon: Key, tab: null, action: () => setShowPasswordForm(true), color: 'blue' },
                      { label: 'Security settings', icon: Shield, tab: 'security', color: 'green' },
                      { label: 'Preferences', icon: Palette, tab: 'preferences', color: 'purple' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => (item.action ? item.action() : setActiveTab(item.tab))}
                        className="w-full text-left p-3 rounded-xl transition-colors hover:bg-[var(--surface-overlay)] group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10">
                              <item.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className={`text-sm font-medium ${headingClass}`}>{item.label}</span>
                          </div>
                          <span className="text-content-muted group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task stats */}
                {taskCounts && (taskCounts.myOpen > 0 || taskCounts.overdue > 0) && (
                  <div className={`${surfaceCardClass} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headingClass}`}>
                      <ClipboardList className="w-5 h-5 text-blue-500" />
                      Your tasks
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3 bg-[var(--surface-overlay)]">
                        <p className={`text-xs ${textMutedClass}`}>Open</p>
                        <p className={`text-2xl font-bold ${headingClass}`}>{taskCounts.myOpen}</p>
                      </div>
                      <div className="rounded-xl p-3 bg-[var(--surface-overlay)]">
                        <p className={`text-xs ${textMutedClass}`}>Overdue</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                          {taskCounts.overdue}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/tasks"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View tasks <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Account status */}
                <div className={`${surfaceCardClass} p-6`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headingClass}`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Account status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-overlay)]">
                      <div className="flex items-center gap-3">
                        {emailVerified ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                        <span className={`text-sm font-medium ${headingClass}`}>Email verified</span>
                      </div>
                      <span
                        className={`text-xs font-medium ${emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}
                      >
                        {emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-overlay)]">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className={`text-sm font-medium ${headingClass}`}>Two-factor auth</span>
                      </div>
                      <span
                        className={`text-xs font-medium ${mfaEnabled ? 'text-emerald-600' : 'text-content-muted'}`}
                      >
                        {mfaEnabled ? 'Enabled' : 'Not enabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-overlay)]">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <span className={`text-sm font-medium ${headingClass}`}>Last login</span>
                      </div>
                      <span className="text-xs text-content-muted text-right max-w-[50%] truncate">
                        {lastLogin ? formatTimeAgo(lastLogin) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className={`${surfaceCardClass} p-6 sm:p-8`}
            >
              <h2 className={`text-xl font-bold mb-6 ${headingClass}`}>Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${headingClass}`}>
                    <Key className="w-5 h-5 text-blue-600" />
                    Password
                  </h3>
                  <p className={`text-sm mb-4 ${textMutedClass}`}>
                    Use a strong, unique password to protect your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Change password
                  </button>
                </div>

                <div>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${headingClass}`}>
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Two-factor authentication
                  </h3>
                  <div className="rounded-xl p-4 bg-[var(--surface-overlay)] border border-[var(--border-primary)]">
                    <p className={`text-sm ${textMutedClass} mb-3`}>
                      {mfaEnabled
                        ? 'Two-factor authentication is active on your account.'
                        : 'Add an extra layer of security. Contact your IT administrator to enable 2FA.'}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        mfaEnabled
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[var(--surface-base)] text-content-muted border border-[var(--border-primary)]'
                      }`}
                    >
                      {mfaEnabled ? 'Enabled' : 'Not configured'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-[var(--surface-overlay)]">
                    <div>
                      <div className={`font-medium text-sm ${headingClass}`}>Login notifications</div>
                      <div className={`text-xs ${textMutedClass}`}>Alert on new sign-ins (local preference)</div>
                    </div>
                    <ToggleSwitch
                      enabled={preferences.login_notifications}
                      label="Login notifications"
                      onToggle={() =>
                        setPreferences((p) => ({ ...p, login_notifications: !p.login_notifications }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePreferencesSave}
                    disabled={prefsSaving}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {prefsSaving ? 'Saving...' : 'Save security preferences'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className={`${surfaceCardClass} p-6 sm:p-8`}
            >
              <h2 className={`text-xl font-bold mb-6 ${headingClass}`}>Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                    <Sun className="w-5 h-5 text-amber-500" />
                    Appearance
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'light', label: 'Light', icon: Sun },
                      { key: 'dark', label: 'Dark', icon: Moon },
                      { key: 'system', label: 'System', icon: Monitor },
                    ].map((themeOption) => {
                      const Icon = themeOption.icon;
                      const selected = preference === themeOption.key;
                      return (
                        <button
                          key={themeOption.key}
                          type="button"
                          onClick={() => setThemePreference(themeOption.key)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              : 'border-[var(--border-primary)] hover:bg-[var(--surface-overlay)] text-content-secondary'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{themeOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingClass}`}>
                    <Bell className="w-5 h-5 text-purple-500" />
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-overlay)]">
                      <div>
                        <div className={`font-medium text-sm ${headingClass}`}>Email notifications</div>
                        <div className={`text-xs ${textMutedClass}`}>Receive updates via email</div>
                      </div>
                      <ToggleSwitch
                        enabled={preferences.email_notifications}
                        label="Email notifications"
                        onToggle={() =>
                          setPreferences((p) => ({ ...p, email_notifications: !p.email_notifications }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${headingClass}`}>
                    <Clock className="w-5 h-5 text-orange-500" />
                    Session timeout reminder
                  </h3>
                  <select
                    value={preferences.session_timeout}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, session_timeout: Number(e.target.value) }))
                    }
                    className={`w-full max-w-xs px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 border-[var(--border-primary)] bg-[var(--surface-base)] text-content-primary`}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                  <p className={`text-xs mt-2 ${textMutedClass}`}>
                    Saved locally on this device. Full session enforcement requires server configuration.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreferencesSave}
                disabled={prefsSaving}
                className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {prefsSaving ? 'Saving...' : 'Save preferences'}
              </button>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className={`${surfaceCardClass} p-6 sm:p-8`}
            >
              <h2 className={`text-xl font-bold mb-6 ${headingClass}`}>Recent activity</h2>

              {activityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-content-muted mb-3 opacity-50" />
                  <p className={`${textMutedClass}`}>No activity recorded yet.</p>
                  <p className={`text-sm mt-1 ${textMutedClass}`}>
                    Actions like logins and profile updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => {
                    const meta = getActivityMeta(log.action);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-overlay)]"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 flex-shrink-0">
                          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${headingClass}`}>
                            {log.description || log.action || 'Activity'}
                          </div>
                          {log.page_url && (
                            <div className={`text-xs truncate ${textMutedClass}`}>{log.page_url}</div>
                          )}
                        </div>
                        <div className={`text-xs flex-shrink-0 ${textMutedClass}`}>
                          {formatTimeAgo(log.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password modal */}
        <AnimatePresence>
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPasswordForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`rounded-xl p-6 w-full max-w-md border ${surfaceCardClass}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="password-modal-title"
              >
                <h3 id="password-modal-title" className={`text-lg font-semibold mb-4 ${headingClass}`}>
                  Change password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {['current', 'next', 'confirm'].map((field) => {
                    const labels = {
                      current: 'Current password',
                      next: 'New password',
                      confirm: 'Confirm new password',
                    };
                    const keys = {
                      current: 'current_password',
                      next: 'new_password',
                      confirm: 'confirm_password',
                    };
                    return (
                      <div key={field}>
                        <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                          {labels[field]}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswordFields[field] ? 'text' : 'password'}
                            value={passwordData[keys[field]]}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, [keys[field]]: e.target.value })
                            }
                            required
                            className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 border-[var(--border-primary)] bg-[var(--surface-base)] text-content-primary`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswordFields((prev) => ({ ...prev, [field]: !prev[field] }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                            aria-label={showPasswordFields[field] ? 'Hide password' : 'Show password'}
                          >
                            {showPasswordFields[field] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {passwordData.new_password && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={textMutedClass}>Password strength</span>
                        <span className={headingClass}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-overlay)] overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50 text-sm font-medium"
                    >
                      {passwordUpdating ? 'Updating...' : 'Update password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-content-secondary hover:bg-[var(--surface-overlay)] text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
