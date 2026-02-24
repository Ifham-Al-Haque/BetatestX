import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Filter, Calendar, Clock, CheckCircle, 
  AlertCircle, UserX, FileText, TrendingUp, BarChart3,
  ChevronRight, Eye, Edit, Trash, Download, Upload, Target,
  Award, Building, Shield, Monitor, Briefcase, Key, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import onboardingOffboardingApi from '../services/onboardingOffboardingApi';
import OffboardingDashboard from '../components/offboarding/OffboardingDashboard';
import OffboardingList from '../components/offboarding/OffboardingList';
import StartOffboardingModal from '../components/offboarding/StartOffboardingModal';
import OffboardingDetail from '../components/offboarding/OffboardingDetail';

export default function EmployeeOffboarding() {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'list', 'detail'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [offboardingRecords, setOffboardingRecords] = useState([]);
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
    loadOffboardingData();
  }, [refreshKey]);

  const loadOffboardingData = async () => {
    try {
      setLoading(true);
      const [recordsData, statsData] = await Promise.all([
        onboardingOffboardingApi.offboarding.getAll(),
        onboardingOffboardingApi.utils.getOffboardingStats()
      ]);
      
      setOffboardingRecords(recordsData);
      setStats(statsData);
    } catch (err) {
      showError('Error', 'Failed to load offboarding data');
      console.error('Error loading offboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOffboarding = async (offboardingData) => {
    try {
      await onboardingOffboardingApi.offboarding.startOffboarding(
        offboardingData.employee_id,
        offboardingData
      );
      
      success('Success', 'Offboarding process started successfully');
      setShowStartModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      showError('Error', err.message || 'Failed to start offboarding process');
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setActiveView('list');
  };

  const handleBackToDashboard = () => {
    setSelectedRecord(null);
    setActiveView('dashboard');
  };

  const filteredRecords = offboardingRecords.filter(record => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
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
                Employee Offboarding
              </h1>
              <p className="text-gray-600">
                Manage employee offboarding processes, asset returns, and access revocation
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeView !== 'detail' && (
                <motion.button
                  onClick={() => setShowStartModal(true)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Start Offboarding</span>
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
                    ? 'border-red-500 text-red-600'
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
                    ? 'border-red-500 text-red-600'
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
              <OffboardingDashboard 
                stats={stats}
                recentRecords={offboardingRecords.slice(0, 5)}
                onViewRecord={handleViewRecord}
                onStartOffboarding={() => setShowStartModal(true)}
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
              <OffboardingList 
                records={filteredRecords}
                onViewRecord={handleViewRecord}
                onStartOffboarding={() => setShowStartModal(true)}
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
              <OffboardingDetail 
                record={selectedRecord}
                onBack={handleBackToList}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Offboarding Modal */}
        {showStartModal && (
          <StartOffboardingModal
            onClose={() => setShowStartModal(false)}
            onStart={handleStartOffboarding}
          />
        )}
      </div>
    </div>
  );
}
