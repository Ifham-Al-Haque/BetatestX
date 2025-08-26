import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  MessageSquare, BarChart3, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const Surveys = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    questions: [''],
    start_date: '',
    end_date: '',
    anonymous: false
  });

  const categories = [
    'Employee Satisfaction',
    'Work Environment',
    'Management Feedback',
    'Training & Development',
    'Benefits & Compensation',
    'Company Culture',
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockSurveys = [
        {
          id: '1',
          title: 'Employee Satisfaction Survey 2024',
          description: 'Annual survey to measure employee satisfaction and identify areas for improvement',
          category: 'Employee Satisfaction',
          questions: [
            'How satisfied are you with your current role?',
            'How would you rate your work-life balance?',
            'How satisfied are you with your manager?',
            'How likely are you to recommend this company to others?'
          ],
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          anonymous: true,
          created_by: user?.id || '1',
          created_by_name: 'HR Manager',
          created_at: '2024-01-01T10:00:00Z',
          responses_count: 45,
          total_employees: 60
        },
        {
          id: '2',
          title: 'Training Needs Assessment',
          description: 'Survey to identify training and development needs across the organization',
          category: 'Training & Development',
          questions: [
            'What skills would you like to develop?',
            'What training programs would be most beneficial?',
            'How do you prefer to learn new skills?'
          ],
          status: 'draft',
          start_date: '',
          end_date: '',
          anonymous: false,
          created_by: user?.id || '1',
          created_by_name: 'HR Manager',
          created_at: '2024-01-05T14:00:00Z',
          responses_count: 0,
          total_employees: 60
        }
      ];

      setSurveys(mockSurveys);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const surveyData = {
        ...formData,
        created_by: user.id,
        created_by_name: userProfile?.full_name || 'Unknown',
        created_at: new Date().toISOString(),
        responses_count: 0,
        total_employees: 60 // This should come from actual employee count
      };

      if (editingSurvey) {
        // Update existing survey
        const updatedSurveys = surveys.map(survey => 
          survey.id === editingSurvey.id ? { ...survey, ...surveyData } : survey
        );
        setSurveys(updatedSurveys);
        success('Success', 'Survey updated successfully!');
      } else {
        // Create new survey
        const newSurvey = {
          ...surveyData,
          id: Date.now().toString()
        };
        setSurveys([...surveys, newSurvey]);
        success('Success', 'Survey created successfully!');
      }

      setShowForm(false);
      setEditingSurvey(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting survey:', err);
      showError('Error', 'Failed to submit survey. Please try again.');
    }
  };

  const handleEdit = (survey) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description,
      category: survey.category,
      questions: survey.questions,
      start_date: survey.start_date || '',
      end_date: survey.end_date || '',
      anonymous: survey.anonymous
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        const updatedSurveys = surveys.filter(survey => survey.id !== id);
        setSurveys(updatedSurveys);
        success('Success', 'Survey deleted successfully!');
      } catch (err) {
        console.error('Error deleting survey:', err);
        showError('Error', 'Failed to delete survey. Please try again.');
      }
    }
  };

  const handleStatusChange = async (surveyId, newStatus) => {
    try {
      const updatedSurveys = surveys.map(survey => 
        survey.id === surveyId ? { ...survey, status: newStatus } : survey
      );
      setSurveys(updatedSurveys);
      success('Success', `Survey status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating survey status:', err);
      showError('Error', 'Failed to update survey status. Please try again.');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, '']
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const updateQuestion = (index, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      questions: [''],
      start_date: '',
      end_date: '',
      anonymous: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = (survey) => {
    return user.id === survey.created_by || userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const canDelete = (survey) => {
    return user.id === survey.created_by || userProfile?.role === 'admin';
  };

  const canChangeStatus = (survey) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const getResponseRate = (survey) => {
    if (survey.total_employees === 0) return 0;
    return Math.round((survey.responses_count / survey.total_employees) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      
      <div className="ml-80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surveys Management</h1>
            <p className="text-gray-600">Create and manage employee surveys and feedback collection</p>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Surveys</p>
                  <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {surveys.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {surveys.length > 0 ? Math.round(surveys.reduce((acc, s) => acc + getResponseRate(s), 0) / surveys.length) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {surveys.filter(s => s.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search surveys..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-64"
                  />
                </div>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Survey
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Survey Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingSurvey ? 'Edit Survey' : 'Create New Survey'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSurvey(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Survey Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter survey title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Survey Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    placeholder="Describe the purpose and scope of this survey..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="anonymous" className="text-sm">Anonymous responses</Label>
                </div>

                <div>
                  <Label>Survey Questions *</Label>
                  <div className="space-y-2">
                    {formData.questions.map((question, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={question}
                          onChange={(e) => updateQuestion(index, e.target.value)}
                          placeholder={`Question ${index + 1}`}
                          required
                          className="flex-1"
                        />
                        {formData.questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQuestion}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSurvey(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSurvey ? 'Update Survey' : 'Create Survey'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Surveys List */}
        <Card>
          <CardHeader>
            <CardHeader>Surveys List</CardHeader>
          </CardHeader>
          <CardContent>
            {surveys.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No surveys found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.map((survey) => (
                  <motion.div
                    key={survey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {survey.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(survey.status)}`}>
                            {survey.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">{survey.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Questions:</h4>
                            <ul className="space-y-1">
                              {survey.questions.slice(0, 3).map((question, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-gray-400 mr-2">•</span>
                                  <span className="truncate">{question}</span>
                                </li>
                              ))}
                              {survey.questions.length > 3 && (
                                <li className="text-sm text-gray-500">
                                  +{survey.questions.length - 3} more questions
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Building className="w-4 h-4" />
                              <span>{survey.category}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>By: {survey.created_by_name}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <BarChart3 className="w-4 h-4" />
                              <span>Response Rate: {getResponseRate(survey)}% ({survey.responses_count}/{survey.total_employees})</span>
                            </div>
                            {survey.start_date && survey.end_date && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(survey.start_date).toLocaleDateString()} - {new Date(survey.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Change Controls */}
                        {canChangeStatus(survey) && (
                          <select
                            value={survey.status}
                            onChange={(e) => handleStatusChange(survey.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                          </select>
                        )}

                        {canEdit(survey) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(survey)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(survey) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(survey.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Surveys;
