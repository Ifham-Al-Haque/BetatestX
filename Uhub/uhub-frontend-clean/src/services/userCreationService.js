// User Creation Service - Creates application users (not employees)
// This service handles UHub application access control
import { supabase } from '../supabaseClient';

class UserCreationService {
  /**
   * Create a complete user account for UHub application access
   * @param {Object} userData - User information
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.role - User role for application access
   * @param {string} userData.full_name - User's full name
   * @param {boolean} userData.emailConfirmed - Whether email is confirmed (default: false)
   * @returns {Object} - Result object with success status and data
   */
  static async createCompleteUser(userData) {
    try {
      console.log('🔧 Creating UHub application user:', userData.email);

      // Step 1: Check if user already exists
      const existingUser = await this.checkUserExists(userData.email);
      if (existingUser.exists) {
        return {
          success: false,
          error: `User with email ${userData.email} already exists`,
          existingUser: existingUser.user
        };
      }

      // Step 2: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: userData.role,
            full_name: userData.full_name
          }
        }
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        return {
          success: false,
          error: `Failed to create auth user: ${authError.message}`
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'No user data returned from auth creation'
        };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Step 3: Create user record in users table (for application access control)
      const userRecordData = {
        auth_user_id: authData.user.id,
        email: userData.email,
        role: userData.role,
        status: 'active',
        full_name: userData.full_name || userData.email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert(userRecordData)
        .select()
        .single();

      if (userError) {
        console.error('❌ User record creation failed:', userError);
        
        // Clean up: Delete the auth user if user record creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🧹 Cleaned up auth user after user record creation failure');
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup auth user:', cleanupError);
        }

        return {
          success: false,
          error: `Failed to create user record: ${userError.message}`
        };
      }

      console.log('✅ User record created:', userRecord.id);

      // Step 4: If email confirmation is required, send confirmation email
      if (!userData.emailConfirmed) {
        try {
          await supabase.auth.resend({
            type: 'signup',
            email: userData.email
          });
          console.log('📧 Confirmation email sent');
        } catch (emailError) {
          console.warn('⚠️ Failed to send confirmation email:', emailError);
        }
      }

      return {
        success: true,
        data: {
          authUser: authData.user,
          userRecord: userRecord,
          message: userData.emailConfirmed 
            ? 'User account created successfully and ready to use'
            : 'User account created successfully. Please check email for confirmation.'
        }
      };

    } catch (error) {
      console.error('💥 Unexpected error in createCompleteUser:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Check if a user already exists (either in auth or users table)
   * @param {string} email - User email to check
   * @returns {Object} - Object with exists status and user data if found
   */
  static async checkUserExists(email) {
    try {
      // Check in users table (for application access control)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        console.error('Error checking users table:', userError);
      }

      // Check in auth.users (if we have access)
      let authUser = null;
      try {
        const { data: authData, error: authError } = await supabase
          .from('auth.users')
          .select('id, email, email_confirmed_at')
          .eq('email', email)
          .maybeSingle();

        if (!authError && authData) {
          authUser = authData;
        }
      } catch (authCheckError) {
        // We might not have access to auth.users table
        console.log('Cannot check auth.users table directly');
      }

      if (user || authUser) {
        return {
          exists: true,
          user: {
            userRecord: user,
            authUser,
            hasAuthAccount: !!authUser,
            hasUserRecord: !!user
          }
        };
      }

      return { exists: false, user: null };

    } catch (error) {
      console.error('Error checking user existence:', error);
      return { exists: false, user: null, error: error.message };
    }
  }

  /**
   * Create auth account for existing user
   * @param {string} email - User email
   * @param {string} password - New password
   * @returns {Object} - Result object
   */
  static async createAuthForExistingUser(email, password) {
    try {
      console.log('🔧 Creating auth account for existing user:', email);

      // Step 1: Find existing user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: `User not found: ${email}`
        };
      }

      if (user.auth_user_id) {
        return {
          success: false,
          error: `User already has auth account: ${user.auth_user_id}`
        };
      }

      // Step 2: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: user.role,
            full_name: user.full_name
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: `Failed to create auth user: ${authError.message}`
        };
      }

      // Step 3: Update user record with auth_user_id
      const { error: updateError } = await supabase
        .from('users')
        .update({
          auth_user_id: authData.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        // Clean up auth user if update fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }

        return {
          success: false,
          error: `Failed to update user record: ${updateError.message}`
        };
      }

      return {
        success: true,
        data: {
          authUser: authData.user,
          userRecord: { ...user, auth_user_id: authData.user.id },
          message: 'Auth account created and linked to existing user'
        }
      };

    } catch (error) {
      console.error('Error creating auth for existing user:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Bulk create users from CSV or array data
   * @param {Array} usersData - Array of user data objects
   * @returns {Object} - Result object with success/failure counts
   */
  static async bulkCreateUsers(usersData) {
    const results = {
      total: usersData.length,
      successful: 0,
      failed: 0,
      errors: [],
      successfulUsers: []
    };

    for (const userData of usersData) {
      try {
        const result = await this.createCompleteUser(userData);
        if (result.success) {
          results.successful++;
          results.successfulUsers.push(result.data);
        } else {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: result.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Validate user data before creation
   * @param {Object} userData - User data to validate
   * @returns {Object} - Validation result
   */
  static validateUserData(userData) {
    const errors = [];

    // Required fields
    if (!userData.email) errors.push('Email is required');
    if (!userData.password) errors.push('Password is required');
    if (!userData.role) errors.push('Role is required');

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userData.email && !emailRegex.test(userData.email)) {
      errors.push('Invalid email format');
    }

    // Password strength
    if (userData.password && userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Role validation
    const validRoles = ['admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer'];
    if (userData.role && !validRoles.includes(userData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all users (admin only)
   * @returns {Object} - Result object with users list
   */
  static async getAllUsers() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Failed to fetch users: ${error.message}`
        };
      }

      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role
   * @returns {Object} - Result object
   */
  static async updateUserRole(userId, newRole) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update user role: ${error.message}`
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }
}

export default UserCreationService;
