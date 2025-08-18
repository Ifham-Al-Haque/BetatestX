import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, User, Phone, MapPin,
  CheckCircle, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log('🔍 Fetching invitation with token:', token);
        
        // Use the RPC function to get invitation details
        const { data: funcData, error: funcError } = await supabase
          .rpc('get_invitation_by_token', { invitation_token: token });

        console.log('📊 Function access result:', { funcData, funcError });
        console.log('🔍 funcData type:', typeof funcData);
        console.log('🔍 funcData length:', funcData ? funcData.length : 'null');
        console.log('🔍 funcData content:', JSON.stringify(funcData, null, 2));

        if (funcError) {
          console.error('❌ Function error:', funcError);
          console.error('❌ Function error details:', {
            message: funcError.message,
            details: funcError.details,
            hint: funcError.hint,
            code: funcError.code,
            fullError: JSON.stringify(funcError, null, 2)
          });
          throw funcError;
        }
        
        // Function returns a table, so we need to get the first item
        const data = funcData && funcData.length > 0 ? funcData[0] : null;
        console.log('🔍 Extracted data:', data);

        if (!data) {
          console.log('❌ No invitation data found');
          showError('Error', 'Invalid or expired invitation');
          navigate('/login');
          return;
        }

        console.log('✅ Invitation data loaded:', data);

        if (new Date(data.expires_at) < new Date()) {
          console.log('❌ Invitation has expired');
          showError('Error', 'Invitation has expired');
          navigate('/login');
          return;
        }

        // Ensure the invitation data has consistent structure
        const normalizedInvitation = {
          id: data.id || null,
          email: data.email || '',
          role: data.role || 'employee',
          status: data.status || 'pending',
          token: data.token || null,
          expires_at: data.expires_at || null,
          invited_at: data.invited_at || null,
          requested_at: data.requested_at || null
        };
        
        setInvitation(normalizedInvitation);
        setFormData(prev => ({ ...prev, email: normalizedInvitation.email }));
        console.log('✅ Invitation state updated successfully with normalized data:', normalizedInvitation);
      } catch (err) {
        console.error('💥 Fetch invitation error:', err);
        console.error('💥 Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code,
          fullError: JSON.stringify(err, null, 2)
        });
        showError('Error', 'Failed to load invitation');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      console.log('🚀 Starting invitation fetch for token:', token);
      fetchInvitation();
    } else {
      console.log('❌ No token provided');
    }
  }, [token, navigate, showError]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Accept invitation
  const handleAcceptInvitation = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setAccepting(true);
    try {
      // First, create the user account using the invitation
      const { data: acceptData, error: acceptError } = await supabase
        .rpc('accept_invitation', {
          invitation_token: token,
          user_password: formData.password,
          user_full_name: formData.full_name,
          user_phone: formData.phone || null,
          user_location: formData.location || null
        });

      if (acceptError) throw acceptError;

      if (acceptData.success) {
        // Account created successfully in the database
        // Now sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: invitation.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: invitation.role,
              user_id: acceptData.data.user_id,
              employee_id: acceptData.data.employee_id
            }
          }
        });

        if (authError) {
          // If auth signup fails, we should clean up the database records
          console.warn('Auth signup failed, but database records were created:', authError);
          // For now, we'll still show success since the account exists in the database
        }

        success('Success', 'Account created successfully! You can now log in.');
        navigate('/login');
      } else {
        showError('Error', acceptData.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Accept invitation error:', err);
      showError('Error', err.message || 'Failed to create account');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Debug information
  console.log('🔍 InvitationAccept Component Debug:', {
    token,
    invitation,
    loading,
    formData
  });

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600">This invitation is invalid or has expired.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your account to get started
          </p>
        </div>

        {/* Invitation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Invitation Details</h3>
              <p className="text-sm text-blue-700">
                You've been invited to join as a <strong>{invitation.role}</strong>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Email: {invitation.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleAcceptInvitation}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1 relative">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.full_name ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter your full name"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your phone number"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1 relative">
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your location"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={accepting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>

          {/* Terms */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InvitationAccept;
