import React, { useState, useEffect } from 'react';
import { Users, Mail, Plus, Search, Filter, Download } from 'lucide-react';

const InvitationManager = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch invitations data from API
    setLoading(false);
  }, []);

  // Sample data
  const sampleInvitations = [
    {
      id: 1,
      email: 'john.doe@example.com',
      role: 'driver_management',
      status: 'pending',
      invitedBy: 'admin@udrive.com',
      invitedAt: '2024-01-15',
      expiresAt: '2024-01-22'
    },
    {
      id: 2,
      email: 'jane.smith@example.com',
      role: 'hr_manager',
      status: 'accepted',
      invitedBy: 'admin@udrive.com',
      invitedAt: '2024-01-14',
      acceptedAt: '2024-01-16'
    },
    {
      id: 3,
      email: 'mike.johnson@example.com',
      role: 'employee',
      status: 'expired',
      invitedBy: 'hr@udrive.com',
      invitedAt: '2024-01-10',
      expiresAt: '2024-01-17'
    },
    {
      id: 4,
      email: 'sarah.wilson@example.com',
      role: 'cs_manager',
      status: 'pending',
      invitedBy: 'admin@udrive.com',
      invitedAt: '2024-01-18',
      expiresAt: '2024-01-25'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'driver_management': 'Driver Management',
      'hr_manager': 'HR Manager',
      'cs_manager': 'CS Manager',
      'employee': 'Employee',
      'viewer': 'Viewer'
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Invitation Manager</h1>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Send Invitation
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900">Total Invitations</h3>
              <p className="text-3xl font-bold text-blue-600">24</p>
              <p className="text-sm text-blue-700">All time</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">8</p>
              <p className="text-sm text-yellow-700">Awaiting response</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900">Accepted</h3>
              <p className="text-3xl font-bold text-green-600">14</p>
              <p className="text-sm text-green-700">Successfully joined</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-900">Expired</h3>
              <p className="text-3xl font-bold text-red-600">2</p>
              <p className="text-sm text-red-700">Need renewal</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invitations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="declined">Declined</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>

          {/* Invitations Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invitation History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sampleInvitations.map(invitation => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRoleLabel(invitation.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.invitedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invitation.invitedAt}</div>
                        {invitation.status === 'pending' && (
                          <div className="text-xs text-gray-500">
                            Expires: {invitation.expiresAt}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invitation.status === 'pending' && (
                          <>
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Resend</button>
                            <button className="text-red-600 hover:text-red-900">Cancel</button>
                          </>
                        )}
                        {invitation.status === 'expired' && (
                          <button className="text-green-600 hover:text-green-900">Renew</button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900 ml-3">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default InvitationManager;
