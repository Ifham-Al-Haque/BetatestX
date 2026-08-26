import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Search, CheckCircle, 
  Loader2, Shield, Mail
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * AdminPasswordReset Component
 * 
 * Allows UHub administrators to send a password-reset email.
 * The user chooses their own password from that email — passwords are never
 * displayed or set from this screen.
 */
export default function AdminPasswordReset({ embedded = false }) {
  const { user, role } = useAuth();
  const { success, error: showError } = useToast();
  
  const [targetEmail, setTargetEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const isAuthorized = role === 'admin' || role === 'super_admin';
  
  const handleSearchUser = async () => {
    if (!targetEmail) {
      showError('Search Error', 'Please enter an email address');
      return;
    }
    
    setSearchLoading(true);
    
    try {
      // Verify authorization
      if (!isAuthorized) {
        showError('Unauthorized', 'You do not have permission to reset passwords');
        return;
      }
      
      // Search for the user in auth.users via Supabase Admin API
      // Note: This requires the service role key, which should be in a backend API
      // For now, we'll use a workaround by checking the database
      
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at, email_confirmed_at')
        .eq('email', targetEmail)
        .maybeSingle();
      
      if (authError) {
        // If we can't query auth.users directly, search users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', targetEmail)
          .maybeSingle();
        
        if (userError) {
          showError('Search Failed', userError.message);
          return;
        }
        
        if (userData) {
          setSearchResults([{
            email: userData.email,
            role: userData.role,
            status: userData.status,
            found: true
          }]);
        } else {
          setSearchResults([]);
          showError('User Not Found', `No user found with email: ${targetEmail}`);
        }
      } else if (authUser) {
        // Get additional info from users table if exists
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', targetEmail)
          .maybeSingle();
        
        setSearchResults([{
          email: authUser.email,
          role: userData?.role || 'unknown',
          status: userData?.status || 'unknown',
          confirmed: !!authUser.email_confirmed_at,
          created_at: authUser.created_at,
          found: true
        }]);
      }
      
    } catch (err) {
      showError('Search Error', err.message);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    if (!selectedUser) {
      showError('Reset Error', 'Please select a user first');
      return;
    }
    if (!isAuthorized) {
      showError('Unauthorized', 'You do not have permission to reset passwords');
      return;
    }

    setResetLoading(true);
    try {
      const { error: logError } = await supabase
        .from('password_reset_logs')
        .insert({
          admin_email: user.email,
          target_user_email: selectedUser.email,
          reset_status: 'attempted'
        });
      if (logError) {
        console.warn('Failed to log password reset attempt:', logError);
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;

      success(
        'Reset email sent',
        `A password reset link was sent to ${selectedUser.email}. The user must choose their own password from that email.`
      );
      setSelectedUser(null);
    } catch (err) {
      showError('Reset Error', err.message);
      await supabase
        .from('password_reset_logs')
        .insert({
          admin_email: user.email,
          target_user_email: selectedUser.email,
          reset_status: 'failed',
          error_message: err.message
        });
    } finally {
      setResetLoading(false);
    }
  };
  
  const handleSelectUser = (userData) => {
    setSelectedUser(userData);
    setTargetEmail(userData.email);
  };
  
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Unauthorized Access</h2>
          <p className="text-red-700">
            Only authorized administrators can reset user passwords.
          </p>
          <p className="text-sm text-red-600 mt-4">
            Current user: {user?.email || 'Unknown'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-5">
      {!embedded && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Password Reset</h1>
              <p className="text-blue-100 text-sm">Reset passwords for users (Authorized Admin Only)</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Search className="w-4 h-4 text-blue-600" />
          Search User
        </h2>
        
        <div className="flex gap-3">
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="Enter user email address..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
          />
          <button
            onClick={handleSearchUser}
            disabled={searchLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Search</>}
          </button>
        </div>
        
        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-2"
            >
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectUser(result)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedUser?.email === result.email
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{result.email}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>Role: {result.role}</span>
                        <span>Status: {result.status}</span>
                        {result.confirmed && (
                          <span className="text-green-600">✓ Email Confirmed</span>
                        )}
                      </div>
                    </div>
                    {selectedUser?.email === result.email && (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Password Reset Section */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lock className="w-4 h-4 text-green-600" />
            Reset Password for: {selectedUser.email}
          </h2>
          
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            The user will receive an email and choose their own password. This screen never shows or sets a password.
          </p>
          <button
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
          >
            {resetLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send reset email
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}

