import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent } from "../components/ui/card";
import { motion } from "framer-motion";
import { Activity, Users, Shield, Database } from "lucide-react";
//import { Button } from "../components/ui/button";
//import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

export default function AdminDashboard() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchActivityLogs();
    fetchUsers();
  }, []);

  async function fetchActivityLogs() {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setActivityLogs(data);
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error) setUsers(data);
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
                <p className="text-sm text-gray-600">System administration and monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-600">Activity Logs</p>
                <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
            </div>
            <div className="max-h-[300px] overflow-auto text-sm space-y-2">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <strong className="text-gray-900">{log.action}</strong>
                        <span className="text-gray-600"> — {log.description}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity logs found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* User Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">User Roles & Permissions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.length > 0 ? (
                users.map((user) => (
                  <div key={user.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Email:</span>
                        <span className="text-sm text-gray-600 truncate ml-2">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Role:</span>
                        <span className="text-sm text-gray-600 ml-2 capitalize">{user.role || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Scopes:</span>
                        <span className="text-sm text-gray-600 ml-2">
                          {user.page_scopes?.join(", ") || 'No scopes assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 col-span-2">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
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