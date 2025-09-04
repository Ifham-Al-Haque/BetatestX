import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Users, 
  Hash, 
  Lock, 
  UserPlus, 
  Plus,
  Filter,
  Check,
  Globe,
  Building,
  User,
  Crown,
  Shield
} from 'lucide-react';
import enhancedChatService from '../../services/enhancedChatService';

const NewChatModal = ({ onClose, onStartChat, onStartGroupChat, onStartTeamChat }) => {
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('group');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [deptData, roleData, teamsData, usersData] = await Promise.all([
        enhancedChatService.getDepartments(),
        enhancedChatService.getRoles(),
        enhancedChatService.getTeams(),
        enhancedChatService.getAvailableUsers()
      ]);
      setDepartments(deptData);
      setRoles(roleData);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      // If no search query, show all available users
      try {
        const data = await enhancedChatService.getAvailableUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
      return;
    }

    try {
      setLoading(true);
      const data = await enhancedChatService.searchUsers(query, filters);
      setUsers(data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleUserSelect = (user) => {
    if (activeTab === 'direct') {
      onStartChat(user.user_id || user.id);
      onClose();
    } else {
      setSelectedUsers(prev => {
        const isSelected = prev.find(u => u.user_id === user.user_id || u.id === user.id);
        if (isSelected) {
          return prev.filter(u => u.user_id !== user.user_id && u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      const participantIds = selectedUsers.map(u => u.user_id || u.id);
      const conversationId = await enhancedChatService.createGroupChat(groupName, participantIds, groupType);
      
      if (onStartGroupChat) {
        onStartGroupChat(conversationId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create group chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTeamChat = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      const conversationId = await enhancedChatService.createTeamChat(selectedTeam.id);
      
      if (onStartTeamChat) {
        onStartTeamChat(conversationId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to start team chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUserSelected = (user) => {
    return selectedUsers.some(u => u.user_id === user.user_id || u.id === user.id);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-400' : 'bg-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'direct'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Direct Message
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'group'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-2" />
            Group Chat
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'team'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Team Chat
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'team' ? "Search teams..." : "Search users..."}
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {activeTab !== 'team' && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            )}

            {/* Filters */}
            {showFilters && activeTab !== 'team' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={filters.department || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={filters.role || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Roles</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'direct' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select User to Chat With</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.user_id || user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative mr-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.is_online)}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.department} • {user.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'group' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Group Chat</h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="group"
                      checked={groupType === 'group'}
                      onChange={(e) => setGroupType(e.target.value)}
                      className="mr-2"
                    />
                    <Hash className="w-4 h-4 mr-1" />
                    Group
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="team"
                      checked={groupType === 'team'}
                      onChange={(e) => setGroupType(e.target.value)}
                      className="mr-2"
                    />
                    <Building className="w-4 h-4 mr-1" />
                    Team
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Participants ({selectedUsers.length} selected)</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.user_id || user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        isUserSelected(user) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative mr-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-gray-600 font-medium text-sm">
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(user.is_online)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.department} • {user.role}</div>
                      </div>
                      {isUserSelected(user) && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Group Chat'}
              </button>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Team to Chat With</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleTeamSelect(team)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{team.name}</div>
                      <div className="text-sm text-gray-500">{team.department || 'All Departments'}</div>
                      {team.description && (
                        <div className="text-xs text-gray-400 mt-1">{team.description}</div>
                      )}
                    </div>
                    {selectedTeam?.id === team.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
              {selectedTeam && (
                <button
                  onClick={handleStartTeamChat}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Starting...' : `Start Chat with ${selectedTeam.name}`}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewChatModal;
