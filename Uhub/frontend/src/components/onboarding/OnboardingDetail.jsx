import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Calendar, Clock, CheckCircle, AlertTriangle, 
  FileText, MessageSquare, Upload, Download, Edit, Plus,
  Building, Mail, Phone, Target, Award, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import onboardingOffboardingApi from '../../services/onboardingOffboardingApi';
import OnboardingChecklist from './OnboardingChecklist';

export default function OnboardingDetail({ record, onBack, onRefresh }) {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [onboardingData, setOnboardingData] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (record) {
      loadOnboardingDetails();
    }
  }, [record]);

  const loadOnboardingDetails = async () => {
    try {
      setLoading(true);
      const [detailData, checklistData, commentsData, documentsData] = await Promise.all([
        onboardingOffboardingApi.onboarding.getById(record.record_id),
        onboardingOffboardingApi.onboardingChecklist.getByEmployeeId(record.employee_id),
        onboardingOffboardingApi.comments.getByEmployeeId(record.employee_id, 'onboarding'),
        onboardingOffboardingApi.documents.getByEmployeeId(record.employee_id, 'onboarding')
      ]);
      
      setOnboardingData(detailData);
      setChecklistItems(checklistData);
      setComments(commentsData);
      setDocuments(documentsData);
    } catch (err) {
      showError('Error', 'Failed to load onboarding details');
      console.error('Error loading onboarding details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistUpdate = async (itemId, isCompleted) => {
    try {
      if (isCompleted) {
        await onboardingOffboardingApi.onboardingChecklist.markComplete(itemId, userProfile?.id);
      } else {
        await onboardingOffboardingApi.onboardingChecklist.markIncomplete(itemId);
      }
      
      // Refresh checklist
      const updatedChecklist = await onboardingOffboardingApi.onboardingChecklist.getByEmployeeId(record.employee_id);
      setChecklistItems(updatedChecklist);
      
      // Refresh main data
      onRefresh();
      
      success('Success', isCompleted ? 'Checklist item completed' : 'Checklist item marked incomplete');
    } catch (err) {
      showError('Error', 'Failed to update checklist item');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await onboardingOffboardingApi.comments.add({
        employee_id: record.employee_id,
        process_type: 'onboarding',
        related_record_id: record.record_id,
        comment: newComment.trim(),
        comment_type: 'note',
        created_by: userProfile?.id
      });
      
      setNewComment('');
      setShowAddComment(false);
      
      // Refresh comments
      const updatedComments = await onboardingOffboardingApi.comments.getByEmployeeId(record.employee_id, 'onboarding');
      setComments(updatedComments);
      
      success('Success', 'Comment added successfully');
    } catch (err) {
      showError('Error', 'Failed to add comment');
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

  const getDaysUntilDue = (expectedDate) => {
    if (!expectedDate) return null;
    const today = new Date();
    const dueDate = new Date(expectedDate);
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

  if (!onboardingData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Onboarding Record Not Found</h3>
          <p className="text-gray-500 mb-4">The requested onboarding record could not be found.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(record.expected_completion_date);

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
                  Onboarding Process • {record.department} • {record.position}
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
            <span className="text-sm font-bold text-blue-600">{record.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${record.progress_percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Started: {formatDate(record.start_date)}</span>
            <span>Due: {formatDate(record.expected_completion_date)}</span>
            {record.actual_completion_date && (
              <span>Completed: {formatDate(record.actual_completion_date)}</span>
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
              { id: 'comments', label: 'Comments', icon: MessageSquare },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
                  <h3 className="font-semibold text-gray-900 mb-3">Onboarding Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Start Date:</span>
                      <span className="text-sm font-medium">{formatDate(record.start_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Expected Completion:</span>
                      <span className="text-sm font-medium">{formatDate(record.expected_completion_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Template:</span>
                      <span className="text-sm font-medium">{onboardingData.template?.name || 'Standard'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Remaining</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {checklistItems.filter(item => !item.is_completed).length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
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
            >
              <OnboardingChecklist
                items={checklistItems}
                onUpdate={handleChecklistUpdate}
                employeeId={record.employee_id}
              />
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Comments & Notes</h3>
                <button
                  onClick={() => setShowAddComment(!showAddComment)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Comment</span>
                </button>
              </div>

              {showAddComment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or note..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setShowAddComment(false);
                        setNewComment('');
                      }}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {comment.created_by_employee?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {comment.created_by_employee?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        comment.comment_type === 'milestone' 
                          ? 'bg-green-100 text-green-800'
                          : comment.comment_type === 'concern'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {comment.comment_type}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No comments yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Documents</h3>
                <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200">
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(document => (
                  <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{document.document_name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{document.document_category}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded by {document.uploaded_by_employee?.full_name} on {formatDate(document.created_at)}
                    </p>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
