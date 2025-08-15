import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

export const useUserInvitation = () => {
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const inviteUser = async ({ email, role, department = '' }) => {
    setLoading(true);
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call the invitation function
      const { data, error } = await supabase
        .rpc('invite_user', {
          invite_email: email,
          invite_role: role,
          inviter_id: user.id
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Success - show invitation details
      const invitationUrl = `${window.location.origin}/invite/${data.data.token}`;
      
      success('Success', 'User invited successfully!');
      
      return {
        success: true,
        data: {
          ...data.data,
          invitationUrl
        }
      };

    } catch (err) {
      const errorMessage = err.message || 'Failed to invite user';
      showError('Error', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    inviteUser,
    loading
  };
};