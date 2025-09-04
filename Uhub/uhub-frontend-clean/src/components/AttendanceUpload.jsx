import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Clock, User, Calendar, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function AttendanceUpload() {
  const [files, setFiles] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const fileInputRef = useRef(null);

  const parseDatFile = (fileContent) => {
    try {
      // Parse space-separated values format
      // Format: EmployeeID Name Date Time PunchType1 PunchType2
      const lines = fileContent.split('\n').filter(line => line.trim());
      const rawData = [];
      
      lines.forEach((line, lineIndex) => {
        // Split by spaces but handle names with spaces
        const parts = line.trim().split(/\s+/);
        
        if (parts.length >= 5) {
          // Extract employee ID (first field)
          const employeeId = parts[0];
          
          // Find the date field (format: YYYY-MM-DD)
          let dateIndex = -1;
          let nameParts = [];
          
          for (let i = 1; i < parts.length; i++) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(parts[i])) {
              dateIndex = i;
              // Everything between employee ID and date is the name
              nameParts = parts.slice(1, i);
              break;
            }
          }
          
          if (dateIndex !== -1 && nameParts.length > 0) {
            const name = nameParts.join(' ').replace(/[^\w\s]/g, '').trim(); // Remove special characters
            const date = parts[dateIndex];
            const time = parts[dateIndex + 1];
            
            // Determine punch type based on the numerical values
            const punchType = parts[dateIndex + 2] || '1'; // Default to '1' if not present
            
            rawData.push({
              employeeId: employeeId,
              name: name,
              date: date,
              time: time,
              punchType: punchType,
              lineNumber: lineIndex + 1
            });
          }
        }
      });

      // Group by employee and date
      const groupedData = {};
      rawData.forEach(record => {
        const key = `${record.employeeId}_${record.date}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            employeeId: record.employeeId,
            name: record.name,
            date: record.date,
            punches: []
          };
        }
        groupedData[key].punches.push({
          time: record.time,
          punchType: record.punchType
        });
      });

      // Process each employee's daily attendance
      const processedAttendance = Object.values(groupedData).map(employee => {
        const sortedPunches = employee.punches.sort((a, b) => a.time.localeCompare(b.time));
        const clockIn = sortedPunches[0]?.time || 'N/A';
        const clockOut = sortedPunches[sortedPunches.length - 1]?.time || 'N/A';
        
        // Calculate hours worked
        const hoursWorked = calculateHours(clockIn, clockOut);
        
        return {
          ...employee,
          clockIn,
          clockOut,
          hoursWorked,
          totalPunches: employee.punches.length,
          status: getAttendanceStatus(hoursWorked)
        };
      });

      return processedAttendance;
    } catch (error) {
      throw new Error(`Error parsing file: ${error.message}`);
    }
  };

  const calculateHours = (clockIn, clockOut) => {
    if (clockIn === 'N/A' || clockOut === 'N/A') return 0;
    
    try {
      const [inHour, inMin] = clockIn.split(':').map(Number);
      const [outHour, outMin] = clockOut.split(':').map(Number);
      
      let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
      
      // Handle overnight shifts
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
      }
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      return parseFloat((hours + minutes / 60).toFixed(2));
    } catch (error) {
      return 0;
    }
  };

  const getAttendanceStatus = (hours) => {
    if (hours === 0) return 'Absent';
    if (hours < 6) return 'Partial';
    if (hours >= 6 && hours <= 9) return 'Present';
    if (hours > 9) return 'Overtime';
    return 'Unknown';
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setFiles(Array.from(selectedFiles));
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const allParsedData = await Promise.all(Array.from(selectedFiles).map(async (file) => {
        if (!file.name.endsWith('.dat')) {
          throw new Error(`File "${file.name}" is not a .dat file.`);
        }
        const fileContent = await readFileContent(file);
        return parseDatFile(fileContent);
      }));

      // Flatten the array of processed data
      setProcessedData(allParsedData.flat());
      setSuccess(`Successfully processed ${allParsedData.flat().length} attendance records from ${selectedFiles.length} files`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const exportToCSV = () => {
    if (processedData.length === 0) return;

    const headers = ['Employee ID', 'Name', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Status', 'Total Punches'];
    const csvData = processedData.map(record => [
      record.employeeId,
      record.name,
      record.date,
      record.clockIn,
      record.clockOut,
      record.hoursWorked,
      record.status,
      record.totalPunches
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Absent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Overtime':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Employee Attendance Upload</h3>
        <p className="text-sm text-gray-600">Upload biometric attendance data from .dat files</p>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".dat"
            className="hidden"
            multiple // Allow multiple file selection
          />
          
          {!files.length ? (
            <div onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Click to upload .dat file(s)
              </p>
              <p className="text-sm text-gray-500">
                Supports biometric attendance data files
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="text-center">
                <p className="font-medium text-gray-700 mb-2">Selected Files ({files.length})</p>
                <div className="max-h-32 overflow-y-auto">
                  {files.map((f, index) => (
                    <div key={index} className="text-sm text-gray-500 mb-1">
                      {f.name} ({(f.size / 1024).toFixed(2)} KB)
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setFiles([]);
                  setProcessedData([]);
                  setError('');
                  setSuccess('');
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕ Clear All
              </button>
            </div>
          )}
        </div>

        {/* File Format Help */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Expected .dat File Format:</h4>
          <div className="text-xs text-blue-700 font-mono bg-white p-2 rounded border">
            EmployeeID Name Date Time PunchType
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Example: 255 Humera 2025-07-22 18:41:57 1
          </p>
          <p className="text-xs text-blue-600">
            The system will automatically calculate clock in (first punch) and clock out (last punch) times.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Supports fingerprint, NFC card, and other biometric punch types.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">
                Processing {files.length} file{files.length > 1 ? 's' : ''}...
              </span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-700">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      {processedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-blue-600 font-medium">Total Records</div>
            </div>
            <div className="text-xl font-bold text-blue-800">{processedData.length}</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-sm text-green-600 font-medium">Present</div>
            </div>
            <div className="text-xl font-bold text-green-800">
              {processedData.filter(r => r.status === 'Present').length}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div className="text-sm text-yellow-600 font-medium">Partial</div>
            </div>
            <div className="text-xl font-bold text-yellow-800">
              {processedData.filter(r => r.status === 'Partial').length}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div className="text-sm text-red-600 font-medium">Absent</div>
            </div>
            <div className="text-xl font-bold text-red-800">
              {processedData.filter(r => r.status === 'Absent').length}
            </div>
          </motion.div>
        </div>
      )}

      {/* Attendance Data Table */}
      {processedData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-800">Attendance Records</h4>
            <button
              onClick={exportToCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punches
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((record, index) => (
                  <motion.tr
                    key={`${record.employeeId}_${record.date}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-sm text-gray-500">ID: {record.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.hoursWorked} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalPunches}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 