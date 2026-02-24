import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import { 
  Activity, 
  Users, 
  Shield, 
  Database, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import activityService from "../services/activityService";
//import { Button } from "../components/ui/button";
//import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

export default function AdminDashboard() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityStats, setActivityStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    userRole: '',
    dateFrom: '',
    dateTo: '',
    resourceType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time subscription
    const subscription = activityService.subscribeToActivityLogs((payload) => {
      if (payload.eventType === 'INSERT') {
        setActivityLogs(prev => [payload.new, ...prev.slice(0, itemsPerPage - 1)]);
        // Update stats
        fetchActivityStats();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [filters, currentPage]);

  async function fetchInitialData() {
    setLoading(true);
    await Promise.all([
      fetchActivityLogs(),
      fetchUsers(),
      fetchActivityStats()
    ]);
    setLoading(false);
  }

  async function fetchActivityLogs() {
    try {
      const options = {
        ...filters,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };

      const { data, error } = await activityService.getActivityLogs(options);
      
      if (!error && data) {
        setActivityLogs(data);
        // Get total count for pagination
        const { count } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true });
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order('created_at', { ascending: false });
    if (!error) setUsers(data);
  }

  async function fetchActivityStats() {
    try {
      const stats = await activityService.getActivityStats(30);
      setActivityStats(stats || {});
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  }

  function clearFilters() {
    setFilters({
      search: '',
      action: '',
      userRole: '',
      dateFrom: '',
      dateTo: '',
      resourceType: ''
    });
    setCurrentPage(1);
  }

  async function exportActivityLogs() {
    try {
      const { data } = await activityService.getActivityLogs({
        ...filters,
        limit: 10000 // Export more records
      });
      
      // Convert to CSV
      const csv = convertToCSV(data);
      downloadCSV(csv, 'activity_logs.csv');
      
      // Log the export
      await activityService.logExport('activity_logs', 'csv', data.length);
    } catch (error) {
      console.error('Error exporting activity logs:', error);
    }
  }

  function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = [
      'Date/Time', 'User Email', 'Role', 'Action', 'Description', 
      'Resource Type', 'Page URL', 'IP Address', 'Status Code'
    ];
    
    const rows = data.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_email || 'N/A',
      log.user_role || 'N/A',
      log.action || 'N/A',
      log.description || 'N/A',
      log.resource_type || 'N/A',
      log.page_url || 'N/A',
      log.ip_address || 'N/A',
      log.status_code || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get unique values for filter dropdowns
  const uniqueActions = [...new Set(activityLogs.map(log => log.action).filter(Boolean))];
  const uniqueRoles = [...new Set(activityLogs.map(log => log.user_role).filter(Boolean))];
  const uniqueResourceTypes = [...new Set(activityLogs.map(log => log.resource_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">User activity monitoring and system administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportActivityLogs}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.total_activities || 0}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.unique_users || 0}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Activity</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.activities_today || 0}</p>
                <p className="text-xs text-gray-500">Activities today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Login Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.login_count || 0}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities, users, or descriptions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>

                <select
                  value={filters.userRole}
                  onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Resources</option>
                  {uniqueResourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="From Date"
                />

                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="To Date"
                />

                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Activity Logs</h3>
                  <p className="text-sm text-gray-600">
                    Showing {activityLogs.length} of {totalItems} activities
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-900">{log.user_email || 'Unknown'}</div>
                              <div className="text-gray-500 text-xs capitalize">{log.user_role || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.action === 'login' ? 'bg-green-100 text-green-800' :
                            log.action === 'logout' ? 'bg-red-100 text-red-800' :
                            log.action?.includes('create') ? 'bg-blue-100 text-blue-800' :
                            log.action?.includes('update') ? 'bg-yellow-100 text-yellow-800' :
                            log.action?.includes('delete') ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {log.resource_type || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {log.status_code && (
                            <span className={`inline-flex items-center gap-1 ${
                              log.status_code < 300 ? 'text-green-600' :
                              log.status_code < 400 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {log.status_code < 300 ? <CheckCircle className="w-4 h-4" /> :
                               log.status_code < 400 ? <Info className="w-4 h-4" /> :
                               <XCircle className="w-4 h-4" />}
                              {log.status_code}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activity logs found</p>
                        {Object.values(filters).some(f => f) && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Clear filters to see all activities
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? 'text-blue-600 bg-blue-50 border border-blue-300'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.length > 0 ? (
                users.slice(0, 6).map((user) => (
                  <div key={user.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.role || 'Employee'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Department: {user.department || 'Not assigned'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Status: {user.status || 'Active'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 col-span-3">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
            {users.length > 6 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all {users.length} users →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isViewer(user, pageScope) {
  return user?.role === 'viewer' && user.page_scopes?.includes(pageScope);
}