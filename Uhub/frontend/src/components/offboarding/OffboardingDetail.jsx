import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Calendar, Clock, CheckCircle, AlertTriangle, 
  FileText, MessageSquare, Upload, Download, Edit, Plus,
  Building, Mail, Phone, Target, Award, GraduationCap, Key, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import onboardingOffboardingApi from '../../services/onboardingOffboardingApi';

export default function OffboardingDetail({ record, onBack, onRefresh }) {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [offboardingData, setOffboardingData] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [assetTracking, setAssetTracking] = useState([]);
  const [accessRevocation, setAccessRevocation] = useState([]);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (record) {
      loadOffboardingDetails();
    }
  }, [record]);

  const loadOffboardingDetails = async () => {
    try {
      setLoading(true);
      const [detailData, checklistData, assetData, accessData, commentsData, documentsData] = await Promise.all([
        onboardingOffboardingApi.offboarding.getById(record.record_id),
        onboardingOffboardingApi.offboardingChecklist.getByOffboardingId(record.record_id).catch(() => []),
        onboardingOffboardingApi.assetTracking.getByOffboardingId(record.record_id).catch(() => []),
        onboardingOffboardingApi.accessRevocation.getByOffboardingId(record.record_id).catch(() => []),
        onboardingOffboardingApi.comments.getByEmployeeId(record.employee_id, 'offboarding').catch(() => []),
        onboardingOffboardingApi.documents.getByEmployeeId(record.employee_id, 'offboarding').catch(() => [])
      ]);
      
      setOffboardingData(detailData);
      setChecklistItems(checklistData);
      setAssetTracking(assetData);
      setAccessRevocation(accessData);
      setComments(commentsData);
      setDocuments(documentsData);
    } catch (err) {
      showError('Error', 'Failed to load offboarding details');
      console.error('Error loading offboarding details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = async (item) => {
    try {
      const actorId = userProfile?.employeeId || null;
      if (item.is_completed) {
        await onboardingOffboardingApi.offboardingChecklist.markIncomplete(item.id);
      } else {
        await onboardingOffboardingApi.offboardingChecklist.markComplete(item.id, actorId);
      }
      const updated = await onboardingOffboardingApi.offboardingChecklist.getByOffboardingId(record.record_id);
      setChecklistItems(updated || []);
      onRefresh?.();
      success('Success', item.is_completed ? 'Checklist item marked incomplete' : 'Checklist item completed');
    } catch (err) {
      showError('Error', 'Failed to update checklist item');
    }
  };

  const handleAssetStatus = async (asset, return_status) => {
    try {
      await onboardingOffboardingApi.assetTracking.updateAsset(asset.id, {
        return_status,
        return_date: return_status === 'returned' ? new Date().toISOString().slice(0, 10) : null,
      });
      const updated = await onboardingOffboardingApi.assetTracking.getByOffboardingId(record.record_id);
      setAssetTracking(updated || []);
      success('Success', 'Asset return status updated');
    } catch (err) {
      showError('Error', 'Failed to update asset');
    }
  };

  const handleAccessStatus = async (access, revocation_status) => {
    try {
      await onboardingOffboardingApi.accessRevocation.updateAccess(access.id, {
        revocation_status,
        revoked_by: userProfile?.employeeId || null,
        revoked_at: revocation_status === 'revoked' ? new Date().toISOString() : null,
      });
      const updated = await onboardingOffboardingApi.accessRevocation.getByOffboardingId(record.record_id);
      setAccessRevocation(updated || []);
      success('Success', 'Access revocation status updated');
    } catch (err) {
      showError('Error', 'Failed to update access item');
    }
  };

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
        if (statusIndicator === 'Overdue') return <AlertTriangle className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
      case 'on_hold':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (lastWorkingDate) => {
    if (!lastWorkingDate) return null;
    const today = new Date();
    const dueDate = new Date(lastWorkingDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!offboardingData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Offboarding Record Not Found</h3>
          <p className="text-gray-500 mb-4">The requested offboarding record could not be found.</p>
          <button
            onClick={onBack}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(record.last_working_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {record.full_name || 'Unknown Employee'}
                </h1>
                <p className="text-gray-600">
                  Offboarding Process • {record.department} • {record.position}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.status, record.status_indicator)}`}>
                {getStatusIcon(record.status, record.status_indicator)}
                <span>{record.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              {daysUntilDue !== null && record.status === 'in_progress' && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  daysUntilDue < 0 
                    ? 'bg-red-100 text-red-800' 
                    : daysUntilDue <= 3 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {daysUntilDue < 0 
                    ? `${Math.abs(daysUntilDue)} days overdue`
                    : `${daysUntilDue} days left`
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-red-600">{record.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${record.progress_percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Last Working Day: {formatDate(record.last_working_date)}</span>
            {record.termination_date && (
              <span>Termination: {formatDate(record.termination_date)}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'checklist', label: 'Checklist', icon: CheckCircle },
              { id: 'assets', label: 'Assets', icon: Key },
              { id: 'access', label: 'Access', icon: Shield },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Employee Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Employee Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{record.full_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{record.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Department:</span>
                      <span className="text-sm font-medium">{record.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Position:</span>
                      <span className="text-sm font-medium">{record.position}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Offboarding Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Last Working Date:</span>
                      <span className="text-sm font-medium">{formatDate(record.last_working_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className="text-sm font-medium">{record.reason_for_leaving || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-medium">{record.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-blue-900">{checklistItems.length}</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Completed</p>
                      <p className="text-2xl font-bold text-green-900">
                        {checklistItems.filter(item => item.is_completed).length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Assets</p>
                      <p className="text-2xl font-bold text-orange-900">{assetTracking.length}</p>
                    </div>
                    <Key className="w-8 h-8 text-orange-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Access Items</p>
                      <p className="text-2xl font-bold text-purple-900">{accessRevocation.length}</p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold text-gray-900">Offboarding Checklist</h3>
              {checklistItems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No checklist items yet</p>
                </div>
              ) : (
                checklistItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChecklistToggle(item)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-red-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {item.is_completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.checklist_item}
                        </p>
                        {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          {item.category && <span className="px-2 py-0.5 rounded-full bg-gray-100">{item.category}</span>}
                          {item.priority && <span className="px-2 py-0.5 rounded-full bg-gray-100">{item.priority}</span>}
                          {item.assigned_to_employee?.full_name && <span>Assigned: {item.assigned_to_employee.full_name}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold text-gray-900">Asset Tracking</h3>
              {assetTracking.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assets tracked for this offboarding yet</p>
                </div>
              ) : (
                assetTracking.map((asset) => (
                  <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{asset.asset_name}</p>
                      <p className="text-sm text-gray-500">{asset.asset_type}{asset.asset_id ? ` · ${asset.asset_id}` : ''}</p>
                    </div>
                    <select
                      value={asset.return_status || 'pending'}
                      onChange={(e) => handleAssetStatus(asset, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="returned">Returned</option>
                      <option value="not_returned">Not returned</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'access' && (
            <motion.div
              key="access"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold text-gray-900">Access Revocation</h3>
              {accessRevocation.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No access items listed yet</p>
                </div>
              ) : (
                accessRevocation.map((access) => (
                  <div key={access.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{access.access_name}</p>
                      <p className="text-sm text-gray-500">{access.access_type}</p>
                    </div>
                    <select
                      value={access.revocation_status || 'pending'}
                      onChange={(e) => handleAccessStatus(access, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="revoked">Revoked</option>
                      <option value="partially_revoked">Partially revoked</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold text-gray-900">Documents</h3>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No offboarding documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((document) => (
                    <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <FileText className="w-8 h-8 text-blue-600 mb-2" />
                      <h4 className="font-medium text-gray-900">{document.document_name}</h4>
                      <p className="text-sm text-gray-600">{document.document_type || document.document_category}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
