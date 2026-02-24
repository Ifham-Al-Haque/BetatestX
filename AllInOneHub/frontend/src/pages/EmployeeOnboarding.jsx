import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Filter, Calendar, Clock, CheckCircle, 
  AlertCircle, UserCheck, FileText, TrendingUp, BarChart3,
  ChevronRight, Eye, Edit, Trash, Download, Upload, Target,
  Award, GraduationCap, Building, Shield, Monitor, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import onboardingOffboardingApi from '../services/onboardingOffboardingApi';
import OnboardingDashboard from '../components/onboarding/OnboardingDashboard';
import OnboardingList from '../components/onboarding/OnboardingList';
import NewEmployeeOnboardingModal from '../components/onboarding/NewEmployeeOnboardingModal';
import OnboardingDetail from '../components/onboarding/OnboardingDetail';

export default function EmployeeOnboarding() {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'list', 'detail', 'edit'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [onboardingRecords, setOnboardingRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    dueSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOnboardingData();
  }, [refreshKey]);

  const loadOnboardingData = async () => {
    try {
      setLoading(true);
      console.log('Loading onboarding data...');
      
      const recordsData = await onboardingOffboardingApi.onboardingRecords.getAll();
      console.log('Onboarding records loaded:', recordsData?.length || 0);
      
      // Ensure we always have an array
      const safeRecordsData = Array.isArray(recordsData) ? recordsData : [];
      setOnboardingRecords(safeRecordsData);
      
      // Calculate stats from the records data with safe array operations
      const statsData = {
        total: safeRecordsData.length,
        completed: safeRecordsData.filter(r => r?.onboarding_status === 'completed').length,
        inProgress: safeRecordsData.filter(r => r?.onboarding_status === 'in_progress').length,
        overdue: safeRecordsData.filter(r => {
          if (!r?.onboarding_status || !r?.expected_completion_date) return false;
          return ['pending', 'in_progress'].includes(r.onboarding_status) && 
                 new Date(r.expected_completion_date) < new Date();
        }).length,
        dueSoon: safeRecordsData.filter(r => {
          if (!r?.onboarding_status || !r?.expected_completion_date) return false;
          return ['pending', 'in_progress'].includes(r.onboarding_status) && 
                 new Date(r.expected_completion_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }).length
      };
      
      console.log('Stats calculated:', statsData);
      setStats(statsData);
      
    } catch (err) {
      console.error('Error loading onboarding data:', err);
      
      // Set safe default values instead of showing error
      setOnboardingRecords([]);
      setStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        dueSoon: 0
      });
      
      // Only show error if it's not a "table doesn't exist" error
      if (!err.message?.includes('does not exist') && !err.message?.includes('42P01')) {
        showError('Error', 'Failed to load onboarding data');
      } else {
        console.log('ℹ️ Onboarding tables not set up yet - showing empty state');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async (completeData) => {
    try {
      // Create onboarding record (this stores all the employee data for the onboarding process)
      const onboardingRecord = await onboardingOffboardingApi.onboardingRecords.create(
        completeData.employeeData,
        completeData.onboardingData
      );
      
      success('Success', `Onboarding process started for ${completeData.employeeData.full_name}. Employee record will be created upon completion.`);
      setShowStartModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      showError('Error', err.message || 'Failed to start onboarding process');
      console.error('Error in handleStartOnboarding:', err);
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setActiveView('detail');
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the onboarding record for ${record.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const recordId = record.id || record.record_id;
      await onboardingOffboardingApi.onboardingRecords.delete(recordId);
      
      success('Success', `Onboarding record for ${record.full_name} has been deleted successfully`);
      setRefreshKey(prev => prev + 1); // Refresh the data
      
      // If we're viewing the deleted record, go back to list
      if (selectedRecord && (selectedRecord.id === recordId || selectedRecord.record_id === recordId)) {
        setActiveView('list');
        setSelectedRecord(null);
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to delete onboarding record');
      console.error('Error deleting onboarding record:', err);
    }
  };

  const handleUpdateRecord = async (updatedData) => {
    try {
      const recordId = editingRecord.id || editingRecord.record_id;
      await onboardingOffboardingApi.onboardingRecords.update(recordId, updatedData);
      
      success('Success', `Onboarding record for ${editingRecord.full_name} has been updated successfully`);
      setShowEditModal(false);
      setEditingRecord(null);
      setRefreshKey(prev => prev + 1); // Refresh the data
    } catch (err) {
      showError('Error', err.message || 'Failed to update onboarding record');
      console.error('Error updating onboarding record:', err);
    }
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setActiveView('list');
  };

  const handleBackToDashboard = () => {
    setSelectedRecord(null);
    setActiveView('dashboard');
  };

  const filteredRecords = onboardingRecords.filter(record => {
    const matchesSearch = record.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status, statusIndicator) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        if (statusIndicator === 'Overdue') return 'bg-red-100 text-red-800 border-red-200';
        if (statusIndicator === 'Due Soon') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status, statusIndicator) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        if (statusIndicator === 'Overdue') return <AlertCircle className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
      case 'on_hold':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Employee Onboarding
              </h1>
              <p className="text-gray-600">
                Manage employee onboarding processes and track progress
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeView !== 'detail' && (
                <motion.button
                  onClick={() => setShowStartModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Start Onboarding</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeView === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveView('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeView === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>All Records</span>
                </div>
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingDashboard 
                stats={stats}
                recentRecords={onboardingRecords.slice(0, 5)}
                onViewRecord={handleViewRecord}
                onEditRecord={handleEditRecord}
                onDeleteRecord={handleDeleteRecord}
                onStartOnboarding={() => setShowStartModal(true)}
              />
            </motion.div>
          )}

          {activeView === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingList 
                records={filteredRecords}
                onViewRecord={handleViewRecord}
                onEditRecord={handleEditRecord}
                onDeleteRecord={handleDeleteRecord}
                onStartOnboarding={() => setShowStartModal(true)}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                loading={loading}
              />
            </motion.div>
          )}

          {activeView === 'detail' && selectedRecord && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingDetail 
                record={selectedRecord}
                onBack={handleBackToList}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Onboarding Modal */}
        {showStartModal && (
          <NewEmployeeOnboardingModal
            onClose={() => setShowStartModal(false)}
            onStart={handleStartOnboarding}
          />
        )}

        {/* Edit Onboarding Modal */}
        {showEditModal && editingRecord && (
          <NewEmployeeOnboardingModal
            onClose={() => {
              setShowEditModal(false);
              setEditingRecord(null);
            }}
            onStart={handleUpdateRecord}
            editingRecord={editingRecord}
            mode="edit"
          />
        )}
      </div>
    </div>
  );
}
