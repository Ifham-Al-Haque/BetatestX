// frontend/src/components/InvitationManager.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Copy, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useUserInvitation } from '../hooks/useUserInvitation';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

const InvitationManager = ({ embedded = false }) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [lastInvitation, setLastInvitation] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState(new Set());
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'employee',
    department: ''
  });

  const { inviteUser, loading } = useUserInvitation();
  const { success, error: showError } = useToast();

  // Fetch existing invitations
  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const { data, error } = await supabase
        .rpc('get_pending_invitations');
      
      if (error) {
        console.error('Failed to fetch invitations:', error);
        showError('Error', 'Failed to load invitations');
        return;
      }
      
      setInvitations(data || []);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
      showError('Error', 'Failed to load invitations');
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Load invitations on component mount
  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await inviteUser(inviteForm);
    
    if (result.success) {
      setLastInvitation(result.data);
      setShowInviteForm(false);
      setInviteForm({ email: '', role: 'employee', department: '' });
      
      // Refresh invitations list
      fetchInvitations();
    }
  };

  const copyInvitationLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      success('Success', 'Invitation link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showError('Error', 'Failed to copy to clipboard');
    }
  };

  // Delete invitation function
  const deleteInvitation = async (invitationId) => {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Error', 'User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .rpc('delete_invitation', {
          invitation_id: invitationId,
          deleter_id: user.id
        });

      if (error) {
        console.error('Failed to delete invitation:', error);
        showError('Error', error.message || 'Failed to delete invitation');
        return;
      }

      if (data.success) {
        success('Success', 'Invitation deleted successfully');
        // Refresh the invitations list
        fetchInvitations();
        // Remove from selected invitations
        setSelectedInvitations(prev => {
          const newSet = new Set(prev);
          newSet.delete(invitationId);
          return newSet;
        });
      } else {
        showError('Error', data.error || 'Failed to delete invitation');
      }
    } catch (err) {
      console.error('Failed to delete invitation:', err);
      showError('Error', 'Failed to delete invitation');
    }
  };

  // Bulk delete invitations
  const deleteSelectedInvitations = async () => {
    if (selectedInvitations.size === 0) {
      showError('Error', 'No invitations selected');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedInvitations.size} invitation(s)?`
    );

    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Error', 'User not authenticated');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const invitationId of selectedInvitations) {
        const { data, error } = await supabase
          .rpc('delete_invitation', {
            invitation_id: invitationId,
            deleter_id: user.id
          });

        if (data?.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to delete invitation ${invitationId}:`, error || data?.error);
        }
      }

      if (successCount > 0) {
        success('Success', `Successfully deleted ${successCount} invitation(s)`);
        if (errorCount > 0) {
          showError('Partial Error', `${errorCount} invitation(s) failed to delete`);
        }
        // Refresh and clear selection
        fetchInvitations();
        setSelectedInvitations(new Set());
      } else {
        showError('Error', 'Failed to delete any invitations');
      }
    } catch (err) {
      console.error('Failed to bulk delete invitations:', err);
      showError('Error', 'Failed to delete invitations');
    }
  };

  // Toggle invitation selection
  const toggleInvitationSelection = (invitationId) => {
    setSelectedInvitations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invitationId)) {
        newSet.delete(invitationId);
      } else {
        newSet.add(invitationId);
      }
      return newSet;
    });
  };

  // Select all invitations
  const selectAllInvitations = () => {
    if (selectedInvitations.size === invitations.length) {
      setSelectedInvitations(new Set());
    } else {
      setSelectedInvitations(new Set(invitations.map(inv => inv.id)));
    }
  };

  // Cleanup expired invitations
  const cleanupExpiredInvitations = async () => {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_invitations');

      if (error) {
        console.error('Failed to cleanup expired invitations:', error);
        showError('Error', error.message || 'Failed to cleanup expired invitations');
        return;
      }

      if (data.success) {
        success('Success', `Cleanup completed! Deleted ${data.deleted_count} expired invitations`);
        // Refresh the invitations list
        fetchInvitations();
      } else {
        showError('Error', data.error || 'Failed to cleanup expired invitations');
      }
    } catch (err) {
      console.error('Failed to cleanup expired invitations:', err);
      showError('Error', 'Failed to cleanup expired invitations');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header / toolbar */}
      <div className={`flex items-center ${embedded ? 'justify-end' : 'justify-between'}`}>
        {!embedded && (
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>User Invitations</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Send invitations to new UHub users</p>
          </div>
        )}
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchInvitations}
            disabled={loadingInvitations}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loadingInvitations ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={cleanupExpiredInvitations}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
            title="Remove expired invitations"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Expired
          </button>
          
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
      </div>

      {/* Invitation Form */}
      {showInviteForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Email *</label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Role *</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <option value="admin">Administrator</option>
                <option value="data_operator">Data Operator</option>
                <option value="finance">Finance</option>
                <option value="it_management">IT Management</option>
                <option value="iot_management">IOT Management</option>
                <option value="manager">Manager</option>
                <option value="driver_management">Driver Management</option>
                <option value="operation_management">Operation Management</option>
                <option value="hr_manager">HR Manager</option>
                <option value="cs_manager">CS Manager</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="marketing_specialist">Marketing Specialist</option>
                <option value="marketing_management">Marketing Management</option>
                <option value="subscribe_now">Subscribe Now</option>
                <option value="employee">Employee</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Department</label>
              <input
                type="text"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                placeholder="e.g., IT, HR, Sales"
              />
            </div>
            
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm">
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
              <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Last Invitation Success */}
      {lastInvitation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Invitation Sent Successfully!</h3>
              <p className="text-sm text-green-700">
                Email: {lastInvitation.email} | Role: {lastInvitation.role}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={lastInvitation.invitationUrl}
                  className="flex-1 text-sm bg-white border border-green-300 rounded px-2 py-1"
                />
                <button
                  onClick={() => copyInvitationLink(lastInvitation.invitationUrl)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Invitations list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pending Invitations</h3>
            
            {invitations.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedInvitations.size === invitations.length}
                    onChange={selectAllInvitations}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    Select All ({selectedInvitations.size}/{invitations.length})
                  </span>
                </div>
                
                {selectedInvitations.size > 0 && (
                  <button
                    onClick={deleteSelectedInvitations}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected ({selectedInvitations.size})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {loadingInvitations ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading invitations...</div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No pending invitations</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
            {invitations.map((invitation) => (
              <div key={invitation.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedInvitations.has(invitation.id)}
                      onChange={() => toggleInvitationSelection(invitation.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{invitation.email}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Role: {invitation.role} · Dept: {invitation.department || 'Unassigned'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInvitationLink(`${window.location.origin}/invite/${invitation.token}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the invitation for ${invitation.email}?`)) {
                          deleteInvitation(invitation.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                      title="Delete invitation"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;