import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, UserPlus, Clock, CheckCircle, XCircle, 
  RefreshCw, Trash2, Copy, Eye, EyeOff,
  AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const InvitationManager = () => {
  console.log('InvitationManager component is rendering!'); // Debug log
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'employee',
    department: '',
    position: ''
  });
  const { success, error: showError } = useToast();

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Department management' },
    { value: 'driver_management', label: 'Driver Management', description: 'Driver-related access only' },
    { value: 'employee', label: 'Employee', description: 'Standard user access' },
    { value: 'view', label: 'Viewer', description: 'Read-only access' }
  ];

  const departments = [
    'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 
    'Customer Service', 'Management', 'Driver Operations'
  ];

  // Fetch pending invitations
  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_pending_invitations');

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      showError('Error', 'Failed to fetch invitations');
      console.error('Fetch invitations error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const sendInvitation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .rpc('send_invitation', {
          invite_email: inviteForm.email,
          invite_role: inviteForm.role,
          inviter_id: (await supabase.auth.getUser()).data.user.id
        });

      if (error) throw error;

      if (data.success) {
        success('Success', 'Invitation sent successfully!');
        setShowInviteForm(false);
        setInviteForm({ email: '', role: 'employee', department: '', position: '' });
        fetchInvitations();
      } else {
        showError('Error', data.error || 'Failed to send invitation');
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to send invitation');
      console.error('Send invitation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const { data, error } = await supabase
        .rpc('cancel_invitation', {
          invitation_id: invitationId,
          canceller_id: (await supabase.auth.getUser()).data.user.id
        });

      if (error) throw error;

      if (data.success) {
        success('Success', 'Invitation cancelled successfully!');
        fetchInvitations();
      } else {
        showError('Error', data.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to cancel invitation');
      console.error('Cancel invitation error:', err);
    }
  };

  // Resend invitation
  const resendInvitation = async (invitationId) => {
    try {
      const { data, error } = await supabase
        .rpc('resend_invitation', {
          invitation_id: invitationId,
          resender_id: (await supabase.auth.getUser()).data.user.id
        });

      if (error) throw error;

      if (data.success) {
        success('Success', 'Invitation resent successfully!');
        fetchInvitations();
      } else {
        showError('Error', data.error || 'Failed to resend invitation');
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to resend invitation');
      console.error('Resend invitation error:', err);
    }
  };

  // Copy invitation link
  const copyInvitationLink = (token) => {
    const invitationUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    success('Success', 'Invitation link copied to clipboard!');
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Debug Test */}
      <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
        <p className="text-red-800 font-bold">🔍 INVITATION MANAGER IS RENDERING!</p>
        <p className="text-red-600 text-sm">If you can see this, the component is working!</p>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Invitations</h2>
            <p className="text-gray-600">Send invitations to new users and manage pending invites</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Send Invitation
        </button>
      </div>

      {/* Invitation Form Modal */}
      <AnimatePresence>
        {showInviteForm && (
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
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Send User Invitation</h3>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={sendInvitation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={inviteForm.position}
                    onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Developer"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invitations List */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Invitations ({invitations.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No pending invitations</p>
            <p className="text-sm">Send your first invitation to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <motion.tr
                    key={invitation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                        <div className="text-sm text-gray-500">
                          Invited by {invitation.invited_by_name || invitation.invited_by_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1">{invitation.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyInvitationLink(invitation.token)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Copy invitation link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => resendInvitation(invitation.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Resend invitation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">How it works:</h4>
            <ul className="space-y-1">
              <li>• Send invitation with role assignment</li>
              <li>• User receives email with invitation link</li>
              <li>• User clicks link and sets up their own password</li>
              <li>• Account is automatically created with assigned role</li>
              <li>• Invitations expire after 7 days</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvitationManager;
