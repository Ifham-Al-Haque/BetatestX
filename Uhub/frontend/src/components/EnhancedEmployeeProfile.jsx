import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Plus, Trash,
  Upload, Download, Target, Award, Heart, FileText,
  TrendingUp, BarChart3, PieChart, Activity, Users,
  GraduationCap, BookOpen, Clock3, AlertTriangle,
  ChevronDown, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { enhancedEmployeeApi, exportToCSV } from '../services/enhancedEmployeeApi';
import { useToast } from '../context/ToastContext';

export default function EnhancedEmployeeProfile({ employeeId, onEdit, onBack }) {
  const { success, error: showError } = useToast();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const data = await enhancedEmployeeApi.employees.getById(employeeId);
      setEmployee(data);
    } catch (err) {
      showError('Error', 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentData) => {
    try {
      await enhancedEmployeeApi.documents.upload({
        ...documentData,
        employee_id: employeeId
      });
      success('Success', 'Document uploaded successfully');
      loadEmployeeData();
      setShowDocumentUpload(false);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleSkillAdd = async (skillData) => {
    try {
      await enhancedEmployeeApi.skills.add({
        ...skillData,
        employee_id: employeeId
      });
      success('Success', 'Skill added successfully');
      loadEmployeeData();
      setShowSkillForm(false);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleGoalAdd = async (goalData) => {
    try {
      await enhancedEmployeeApi.goals.add({
        ...goalData,
        employee_id: employeeId
      });
      success('Success', 'Goal added successfully');
      loadEmployeeData();
      setShowGoalForm(false);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleLeaveRequest = async (leaveData) => {
    try {
      await enhancedEmployeeApi.leaveRequests.create({
        ...leaveData,
        employee_id: employeeId
      });
      success('Success', 'Leave request submitted successfully');
      loadEmployeeData();
      setShowLeaveForm(false);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Employee Not Found</h2>
        <p className="text-gray-500">The employee you're looking for doesn't exist.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'skills', label: 'Skills & Training', icon: Award },
    { id: 'goals', label: 'Goals & Objectives', icon: Target },
    { id: 'leave', label: 'Leave Management', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Performance Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance Rating</p>
              <p className={`text-2xl font-semibold ${getPerformanceColor(employee.performance_rating || 0)}`}>
                {employee.performance_rating || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Goals Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {employee.goals?.filter(g => g.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Skills Count</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {employee.skills?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Completeness</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {employee.data_completeness_score || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Emergency Contact</h4>
            <p className="text-gray-900 dark:text-white">{employee.emergency_contact_name || 'Not provided'}</p>
            <p className="text-gray-600 dark:text-gray-400">{employee.emergency_contact_phone || 'No phone'}</p>
            <p className="text-gray-600 dark:text-gray-400">{employee.emergency_contact_relationship || 'No relationship specified'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Next of Kin</h4>
            <p className="text-gray-900 dark:text-white">{employee.next_of_kin_name || 'Not provided'}</p>
            <p className="text-gray-600 dark:text-gray-400">{employee.next_of_kin_phone || 'No phone'}</p>
            <p className="text-gray-600 dark:text-gray-400">{employee.next_of_kin_relationship || 'No relationship specified'}</p>
          </div>
        </div>
      </div>

      {/* Skills Summary */}
      {employee.skills && employee.skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {employee.skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {skill}
              </span>
            ))}
            {employee.skills.length > 5 && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                +{employee.skills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Reviews */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Reviews</h3>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Review
          </button>
        </div>
        {employee.performance_reviews && employee.performance_reviews.length > 0 ? (
          <div className="space-y-4">
            {employee.performance_reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.review_date).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rating: {review.overall_rating}/5
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Goals: {review.goals_achieved}/{review.goals_total}
                  </span>
                </div>
                {review.strengths && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Strengths:</strong> {review.strengths}
                  </p>
                )}
                {review.areas_for_improvement && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Areas for Improvement:</strong> {review.areas_for_improvement}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No performance reviews yet</p>
        )}
      </div>

      {/* Goals Progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goals & Objectives</h3>
          <button 
            onClick={() => setShowGoalForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
        {employee.goals && employee.goals.length > 0 ? (
          <div className="space-y-4">
            {employee.goals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{goal.goal_title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{goal.goal_description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progress:</span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{goal.progress_percentage}%</span>
                  </div>
                  {goal.target_date && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Due: {new Date(goal.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No goals set yet</p>
        )}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Documents</h3>
          <button 
            onClick={() => setShowDocumentUpload(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
        {employee.documents && employee.documents.length > 0 ? (
          <div className="space-y-4">
            {employee.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{doc.document_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No documents uploaded yet</p>
        )}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills & Certifications</h3>
          <button 
            onClick={() => setShowSkillForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
        {employee.skills && employee.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employee.skills.map((skill, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{skill}</h4>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Skill verified and active</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No skills recorded yet</p>
        )}
      </div>

      {/* Training Records */}
      {employee.training_records && employee.training_records.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Records</h3>
          <div className="space-y-3">
            {employee.training_records.map((training, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900 dark:text-white">{training}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Requests</h3>
          <button 
            onClick={() => setShowLeaveForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </button>
        </div>
        {employee.leave_requests && employee.leave_requests.length > 0 ? (
          <div className="space-y-4">
            {employee.leave_requests.map((leave) => (
              <div key={leave.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{leave.leave_type}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">From:</span>
                    <p className="text-gray-900 dark:text-white">{new Date(leave.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">To:</span>
                    <p className="text-gray-900 dark:text-white">{new Date(leave.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Total days: {leave.total_days}
                </p>
                {leave.reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <strong>Reason:</strong> {leave.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No leave requests yet</p>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Data Completeness */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Completeness</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (employee.data_completeness_score || 0) / 100)}`}
                className="text-blue-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {employee.data_completeness_score || 0}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 dark:text-gray-400">
              Employee profile is {employee.data_completeness_score || 0}% complete
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete missing information to improve data quality
            </p>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current Rating</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {employee.performance_rating || 'N/A'}/5
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Goals Completed</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {employee.goals?.filter(g => g.status === 'completed').length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Skills Count</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {employee.skills?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              {employee.profile_picture || employee.photo_url ? (
                <img
                  src={employee.profile_picture || employee.photo_url}
                  alt={employee.full_name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {employee.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{employee.full_name}</h2>
              <p className="text-xl text-blue-100 mb-1">
                {employee.position} — {employee.department}
              </p>
              <div className="flex items-center gap-4 text-blue-100">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {employee.employee_id}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 border border-white/30"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 border border-white/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'performance' && renderPerformance()}
              {activeTab === 'documents' && renderDocuments()}
              {activeTab === 'skills' && renderSkills()}
              {activeTab === 'goals' && renderGoals()}
              {activeTab === 'leave' && renderLeave()}
              {activeTab === 'analytics' && renderAnalytics()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDocumentUpload && (
          <DocumentUploadModal
            onClose={() => setShowDocumentUpload(false)}
            onSubmit={handleDocumentUpload}
          />
        )}
        {showSkillForm && (
          <SkillFormModal
            onClose={() => setShowSkillForm(false)}
            onSubmit={handleSkillAdd}
          />
        )}
        {showGoalForm && (
          <GoalFormModal
            onClose={() => setShowGoalForm(false)}
            onSubmit={handleGoalAdd}
          />
        )}
        {showLeaveForm && (
          <LeaveFormModal
            onClose={() => setShowLeaveForm(false)}
            onSubmit={handleLeaveRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Components (simplified for brevity)
const DocumentUploadModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
      {/* Document upload form would go here */}
      <div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Upload</button>
      </div>
    </div>
  </div>
);

const SkillFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Add Skill</h3>
      {/* Skill form would go here */}
      <div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
      </div>
    </div>
  </div>
);

const GoalFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Add Goal</h3>
      {/* Goal form would go here */}
      <div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
      </div>
    </div>
  </div>
);

const LeaveFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Request Leave</h3>
      {/* Leave request form would go here */}
      <div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={() => onSubmit({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
      </div>
    </div>
  </div>
);
