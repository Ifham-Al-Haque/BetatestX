import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, TrendingUp, FileText, BarChart3, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import AttendanceUpload from '../components/AttendanceUpload';
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Attendance() {
  const [attendanceStats, setAttendanceStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    averageHours: 0,
    totalHours: 0
  });

  // Sample attendance data for demonstration
  const sampleAttendanceData = [
    {
      employeeId: 'EMP001',
      name: 'John Doe',
      date: '2024-01-15',
      clockIn: '09:00',
      clockOut: '17:30',
      hoursWorked: 8.5,
      status: 'Present',
      totalPunches: 2
    },
    {
      employeeId: 'EMP002',
      name: 'Jane Smith',
      date: '2024-01-15',
      clockIn: '08:45',
      clockOut: '18:15',
      hoursWorked: 9.5,
      status: 'Overtime',
      totalPunches: 2
    },
    {
      employeeId: 'EMP003',
      name: 'Mike Johnson',
      date: '2024-01-15',
      clockIn: '10:30',
      clockOut: '16:00',
      hoursWorked: 5.5,
      status: 'Partial',
      totalPunches: 2
    }
  ];

  useEffect(() => {
    // Calculate attendance statistics
    const stats = {
      totalEmployees: sampleAttendanceData.length,
      presentToday: sampleAttendanceData.filter(a => a.status === 'Present').length,
      absentToday: sampleAttendanceData.filter(a => a.status === 'Absent').length,
      averageHours: sampleAttendanceData.reduce((sum, a) => sum + a.hoursWorked, 0) / sampleAttendanceData.length,
      totalHours: sampleAttendanceData.reduce((sum, a) => sum + a.hoursWorked, 0)
    };
    setAttendanceStats(stats);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      className={`bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-gray-600">Track employee attendance and biometric data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Employees"
              value={attendanceStats.totalEmployees}
              subtitle="Active today"
              color="text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              title="Present Today"
              value={attendanceStats.presentToday}
              subtitle="On time"
              color="text-green-600"
            />
            <StatCard
              icon={AlertTriangle}
              title="Absent Today"
              value={attendanceStats.absentToday}
              subtitle="No attendance"
              color="text-red-600"
            />
            <StatCard
              icon={Clock}
              title="Avg. Hours"
              value={attendanceStats.averageHours.toFixed(1)}
              subtitle="Per employee"
              color="text-purple-600"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attendance Upload Section */}
            <motion.div
              className="bg-white rounded-xl shadow border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Upload Attendance Data</h2>
                  <p className="text-sm text-gray-600">Process biometric .dat files</p>
                </div>
              </div>
              <AttendanceUpload />
            </motion.div>

            {/* Recent Attendance */}
            <motion.div
              className="bg-white rounded-xl shadow border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Recent Attendance</h2>
                  <p className="text-sm text-gray-600">Today's attendance overview</p>
                </div>
              </div>

              <div className="space-y-4">
                {sampleAttendanceData.map((record, index) => (
                  <motion.div
                    key={record.employeeId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{record.name}</p>
                        <p className="text-sm text-gray-500">ID: {record.employeeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{record.clockIn} - {record.clockOut}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'Present' ? 'bg-green-100 text-green-700' :
                          record.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          record.status === 'Overtime' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{record.hoursWorked} hrs</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Hours Today:</span>
                  <span className="font-bold text-blue-600">{attendanceStats.totalHours.toFixed(1)} hrs</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Features Section */}
          <motion.div
            className="mt-8 bg-white rounded-xl shadow border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Generate Report</p>
                    <p className="text-sm text-gray-500">Monthly attendance report</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Analytics</p>
                    <p className="text-sm text-gray-500">Attendance trends</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Employee List</p>
                    <p className="text-sm text-gray-500">Manage employees</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
 