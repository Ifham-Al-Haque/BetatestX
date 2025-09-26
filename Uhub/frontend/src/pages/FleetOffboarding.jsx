import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  UserX, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  TrendingUp,
  ChevronRight,
  Eye,
  Edit,
  Trash,
  Download,
  Upload,
  Target,
  Award,
  Building,
  Shield,
  Monitor,
  Briefcase,
  Key,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckSquare
} from 'lucide-react';

const FleetOffboarding = () => {
  const { userProfile } = useAuth();
  const [offboardingRecords, setOffboardingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadFleetOffboardingData();
  }, []);

  const loadFleetOffboardingData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch fleet offboarding records
      // const data = await fleetOffboardingApi.getAll();
      // setOffboardingRecords(data);
      
      // Mock data for now
      setOffboardingRecords([
        {
          id: '1',
          vehicle_id: 'VH001',
          vehicle_number: 'ABC-123',
          make: 'Toyota',
          model: 'Camry',
          offboarding_date: '2024-01-20',
          last_service_date: '2024-01-15',
          status: 'in_progress',
          progress_percentage: 60,
          assigned_driver: 'John Doe',
          department: 'Delivery',
          reason: 'Vehicle replacement',
          checklist_items: [
            { id: '1', item: 'Driver Return Vehicle', completed: true, completed_by: 'Driver', completed_at: '2024-01-20' },
            { id: '2', item: 'Remove GPS Tracking', completed: true, completed_by: 'IT Team', completed_at: '2024-01-21' },
            { id: '3', item: 'Insurance Cancellation', completed: false, assigned_to: 'Admin' },
            { id: '4', item: 'Final Inspection', completed: false, assigned_to: 'Fleet Manager' },
            { id: '5', item: 'Documentation Update', completed: false, assigned_to: 'HR Manager' }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error loading fleet offboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOffboarding = () => {
    setShowStartModal(true);
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard or main page
    window.history.back();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return TrendingUp;
      case 'on_hold': return AlertTriangle;
      case 'not_started': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Fleet Offboarding Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserX className="w-8 h-8 mr-3 text-red-600" />
                Fleet Offboarding
              </h1>
              <p className="text-gray-600 mt-2">
                Manage fleet vehicle offboarding processes and asset returns
              </p>
            </div>
            <button
              onClick={handleStartOffboarding}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start Fleet Offboarding
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <Car className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Offboarding</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Filters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offboarding Records List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Offboarding Records</h2>
            
            {offboardingRecords.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fleet Offboarding Records</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first fleet offboarding process.</p>
                <button
                  onClick={handleStartOffboarding}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start Fleet Offboarding
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {offboardingRecords.map((record) => {
                  const StatusIcon = getStatusIcon(record.status);
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-red-100 rounded-lg">
                            <Car className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {record.vehicle_number} - {record.make} {record.model}
                            </h3>
                            <p className="text-gray-600">Vehicle ID: {record.vehicle_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            <StatusIcon className="w-4 h-4 inline mr-1" />
                            {record.status.replace('_', ' ')}
                          </span>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="text-lg font-semibold text-gray-900">{record.progress_percentage}%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Offboarding Date</p>
                          <p className="font-medium text-gray-900">{record.offboarding_date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Service Date</p>
                          <p className="font-medium text-gray-900">{record.last_service_date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Assigned Driver</p>
                          <p className="font-medium text-gray-900">{record.assigned_driver}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="font-medium text-gray-900">{record.reason}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 flex items-center">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </button>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Start Fleet Offboarding Modal */}
        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Start Fleet Offboarding</h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Start the offboarding process for a fleet vehicle. This will create a comprehensive checklist to ensure all necessary steps are completed and assets are properly returned.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Vehicle
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Vehicle to Offboard</option>
                      <option value="VH001">ABC-123 - Toyota Camry</option>
                      <option value="VH002">XYZ-456 - Honda Civic</option>
                      <option value="VH003">DEF-789 - Ford Focus</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Offboarding
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Reason</option>
                      <option value="vehicle_replacement">Vehicle Replacement</option>
                      <option value="end_of_service">End of Service</option>
                      <option value="damage">Vehicle Damage</option>
                      <option value="upgrade">Fleet Upgrade</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offboarding Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Additional notes about the offboarding process..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement start offboarding logic
                    setShowStartModal(false);
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Start Offboarding
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetOffboarding;
