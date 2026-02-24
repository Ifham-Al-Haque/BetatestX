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
    <div className="space-y-8">
      {/* Enhanced Performance Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Performance Rating</p>
              <p className={`text-3xl font-bold ${getPerformanceColor(employee.performance_rating || 0)}`}>
                {employee.performance_rating || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Goals Completed</p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                {employee.goals?.filter(g => g.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Skills Count</p>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {employee.skills?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Data Completeness</p>
              <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                {employee.data_completeness_score || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Emergency Contacts */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-8 rounded-2xl border-2 border-red-200 dark:border-red-700 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-6 flex items-center gap-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/50 dark:bg-red-900/30 p-6 rounded-xl border border-red-200 dark:border-red-600">
            <h4 className="font-bold text-red-800 dark:text-red-200 mb-3 text-lg">Primary Emergency Contact</h4>
            <div className="space-y-2">
              <p className="text-red-900 dark:text-red-100 font-medium">
                {employee.emergency_contact_name || 'Not provided'}
              </p>
              <p className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {employee.emergency_contact_phone || 'No phone'}
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {employee.emergency_contact_relationship || 'No relationship specified'}
              </p>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-red-900/30 p-6 rounded-xl border border-red-200 dark:border-red-600">
            <h4 className="font-bold text-red-800 dark:text-red-200 mb-3 text-lg">Next of Kin</h4>
            <div className="space-y-2">
              <p className="text-red-900 dark:text-red-100 font-medium">
                {employee.next_of_kin_name || 'Not provided'}
              </p>
              <p className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {employee.next_of_kin_phone || 'No phone'}
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {employee.next_of_kin_relationship || 'No relationship specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Skills Summary */}
      {employee.skills && employee.skills.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-8 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 shadow-lg">
          <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-6 flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            Top Skills & Expertise
          </h3>
          <div className="flex flex-wrap gap-3">
            {employee.skills.slice(0, 8).map((skill, index) => (
              <span key={index} className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm font-medium border border-yellow-200 dark:border-yellow-600 shadow-sm hover:shadow-md transition-all duration-200">
                {skill}
              </span>
            ))}
            {employee.skills.length > 8 && (
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600">
                +{employee.skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8">
      {/* Enhanced Performance Reviews */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200">Performance Reviews</h3>
          </div>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-5 h-5" />
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

      {/* Enhanced Goals Progress */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">Goals & Objectives</h3>
          </div>
          <button 
            onClick={() => setShowGoalForm(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
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
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-200">Employee Documents</h3>
          </div>
          <button 
            onClick={() => setShowDocumentUpload(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
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
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 rounded-2xl border-2 border-amber-200 dark:border-amber-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-200">Skills & Certifications</h3>
          </div>
          <button 
            onClick={() => setShowSkillForm(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
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
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-8 rounded-2xl border-2 border-cyan-200 dark:border-cyan-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">Leave Management</h3>
          </div>
          <button 
            onClick={() => setShowLeaveForm(true)}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
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
    <div className="space-y-8">
      {/* Enhanced Data Completeness */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">Data Completeness</h3>
        </div>
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

      {/* Enhanced Performance Trends */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-8 rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">Performance Trends</h3>
        </div>
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

  const renderGoals = () => (
    <div className="space-y-6">
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

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16"></div>
          </div>
          
          <div className="relative flex items-center gap-8">
            <div className="relative">
              {employee.profile_picture || employee.photo_url ? (
                <img
                  src={employee.profile_picture || employee.photo_url}
                  alt={employee.full_name}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-2xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-3xl font-bold">
                    {employee.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 text-white">{employee.full_name}</h1>
              <p className="text-2xl text-blue-100 mb-2 font-medium">
                {employee.position} — {employee.department}
              </p>
              <div className="flex items-center gap-6 text-blue-100">
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Building className="w-5 h-5" />
                  <span className="font-medium">{employee.employee_id}</span>
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 backdrop-blur-sm ${
                  employee.status === 'active' 
                    ? 'bg-green-500/20 border-green-300 text-green-100'
                    : employee.status === 'inactive'
                    ? 'bg-red-500/20 border-red-300 text-red-100'
                    : employee.status === 'pending'
                    ? 'bg-yellow-500/20 border-yellow-300 text-yellow-100'
                    : 'bg-gray-500/20 border-gray-300 text-gray-100'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onEdit(employeeId)}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl transition-all duration-200 flex items-center gap-3 border-2 border-white/30 backdrop-blur-sm hover:shadow-lg"
              >
                <Edit className="w-5 h-5" />
                <span className="font-semibold">Edit Profile</span>
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl transition-all duration-200 flex items-center gap-3 border-2 border-white/30 backdrop-blur-sm hover:shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">Back</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 px-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-6 px-6 border-b-2 font-semibold text-base flex items-center gap-3 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
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

// Enhanced Modal Components
const DocumentUploadModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Document</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Name</label>
          <input
            type="text"
            placeholder="Enter document name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
          <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option value="">Select type</option>
            <option value="contract">Contract</option>
            <option value="id">ID Document</option>
            <option value="certificate">Certificate</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Upload</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">PDF, DOC, or image files up to 10MB</p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-8">
        <button 
          onClick={onClose} 
          className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit({})} 
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Upload Document
        </button>
      </div>
    </motion.div>
  </div>
);

const SkillFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-500 rounded-lg">
          <Award className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Skill</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill Name</label>
          <input
            type="text"
            placeholder="e.g., JavaScript, Project Management"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proficiency Level</label>
          <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option value="">Select level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label>
          <input
            type="number"
            min="0"
            max="50"
            placeholder="Enter years"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      
      <div className="flex gap-3 mt-8">
        <button 
          onClick={onClose} 
          className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit({})} 
          className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Add Skill
        </button>
      </div>
    </motion.div>
  </div>
);

const GoalFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500 rounded-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Goal</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Title</label>
          <input
            type="text"
            placeholder="e.g., Complete Advanced Certification"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            placeholder="Describe your goal in detail..."
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-8">
        <button 
          onClick={onClose} 
          className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit({})} 
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Set Goal
        </button>
      </div>
    </motion.div>
  </div>
);

const LeaveFormModal = ({ onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Request Leave</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Type</label>
          <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
            <option value="">Select leave type</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
          <textarea
            placeholder="Please provide a reason for your leave request..."
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      
      <div className="flex gap-3 mt-8">
        <button 
          onClick={onClose} 
          className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit({})} 
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Submit Request
        </button>
      </div>
    </motion.div>
  </div>
);
