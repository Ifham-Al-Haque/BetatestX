import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

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
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold">Admin Dashboard</h2>

      <Card>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">Activity Logs</h3>
          <div className="max-h-[300px] overflow-auto text-sm">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-1 border-b border-gray-200">
                <strong>{log.action}</strong> — {log.description} <br />
                <span className="text-xs text-gray-600">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">User Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user.id} className="border p-2 rounded shadow-sm bg-gray-50">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>Scopes:</strong> {user.page_scopes?.join(", ")}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export function isAdmin(user) {
  return user?.role === 'admin';
}
export function isViewer(user, pageScope) {
  return user?.role === 'viewer' && user.page_scopes?.includes(pageScope);
}