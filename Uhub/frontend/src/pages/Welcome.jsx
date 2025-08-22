import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeNavbar from '../components/WelcomeNavbar';
import WelcomeChat from '../components/WelcomeChat';
import { 
  Car, 
  Shield, 
  Users, 
  BarChart3, 
  Calendar, 
  FileText,
  ArrowRight,
  Play,
  Pause,
  Lightbulb,
  Target,
  Globe,
  Plus,
  XCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { suggestionsApi } from '../services/suggestionsApi';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    suggestion_type: 'general',
    target_user_id: '',
    target_user_name: '',
    anonymous: false
  });
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentSuggestions, setRecentSuggestions] = useState([]);

  const features = [
    {
      icon: Car,
      title: 'Fleet Management',
      description: 'Comprehensive driver and vehicle management system',
      color: 'from-[#2FF9B5] to-[#2562CF]'
    },
    {
      icon: Users,
      title: 'HR Operations',
      description: 'Employee management and performance tracking',
      color: 'from-[#FF51EB] to-[#2125DA]'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Data-driven insights and performance metrics',
      color: 'from-[#2562CF] to-[#2FF9B5]'
    },
    {
      icon: Calendar,
      title: 'Task Management',
      description: 'Efficient task assignment and tracking',
      color: 'from-[#2125DA] to-[#FF51EB]'
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, features.length]);

  // Fetch categories and users for suggestion form
  useEffect(() => {
    if (user && userProfile) {
      fetchCategories();
      fetchUsers();
      fetchRecentSuggestions();
    }
  }, [user, userProfile]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await suggestionsApi.getSuggestionCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await suggestionsApi.getUsersForTargeting();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecentSuggestions = async () => {
    try {
      const suggestions = await suggestionsApi.getSuggestions(user.id, userProfile.role);
      setRecentSuggestions(suggestions.slice(0, 3)); // Show only 3 recent suggestions
    } catch (error) {
      console.error('Error fetching recent suggestions:', error);
    }
  };

  const redirectToRolePage = (role) => {
    console.log('Redirecting to role page:', role); // Debug log
    
    switch (role) {
      case 'admin':
        console.log('Navigating to admin dashboard');
        navigate('/admin/dashboard');
        break;
      case 'manager':
        console.log('Navigating to manager dashboard');
        navigate('/dashboard');
        break;
      case 'driver_management':
        console.log('Navigating to drivers page');
        navigate('/drivers');
        break;
      case 'hr_manager':
        console.log('Navigating to attendance page');
        navigate('/attendance');
        break;
      case 'cs_manager':
        console.log('Navigating to CSPA page');
        navigate('/cspa');
        break;
      case 'employee':
        console.log('Navigating to tasks page');
        navigate('/tasks');
        break;
      case 'viewer':
        console.log('Navigating to dashboard');
        navigate('/dashboard');
        break;
      default:
        console.log('Default navigation to dashboard');
        navigate('/dashboard');
    }
  };

  // Add a direct dashboard navigation function for debugging
  const handleDashboardClick = () => {
    console.log('Dashboard button clicked');
    console.log('Current user role:', userProfile?.role);
    console.log('Current user:', user);
    
    if (userProfile?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleFeatureClick = (index) => {
    setCurrentFeature(index);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const suggestionData = {
        ...suggestionForm,
        suggester_id: user.id,
        suggester_name: userProfile?.full_name || user.email
      };

      await suggestionsApi.createSuggestion(suggestionData);
      success('Suggestion submitted successfully!');
      setShowSuggestionForm(false);
      resetSuggestionForm();
      fetchRecentSuggestions();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      showError('Failed to submit suggestion');
    }
  };

  const resetSuggestionForm = () => {
    setSuggestionForm({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      suggestion_type: 'general',
      target_user_id: '',
      target_user_name: '',
      anonymous: false
    });
  };

  const handleSuggestionTypeChange = (type) => {
    setSuggestionForm(prev => ({
      ...prev,
      suggestion_type: type,
      target_user_id: type === 'general' ? '' : prev.target_user_id,
      target_user_name: type === 'general' ? '' : prev.target_user_name
    }));
  };

  const handleTargetUserChange = (userId) => {
    const targetUser = users.find(u => u.id === userId);
    setSuggestionForm(prev => ({
      ...prev,
      target_user_id: userId,
      target_user_name: targetUser ? targetUser.full_name : ''
    }));
  };

  const handleVote = async (suggestionId, voteType) => {
    try {
      if (voteType === 'upvote') {
        await suggestionsApi.upvoteSuggestion(suggestionId);
      } else {
        await suggestionsApi.downvoteSuggestion(suggestionId);
      }
      fetchRecentSuggestions();
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      showError('Failed to vote on suggestion');
    }
  };

  // If user is logged in, show navbar layout
  if (user && userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Welcome Navbar */}
        <WelcomeNavbar />

        {/* Main content area */}
        <div className="pt-16">
          {/* Welcome content */}
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-[#2FF9B5] to-[#FF51EB] bg-clip-text text-transparent">
                    {userProfile.full_name || user.email.split('@')[0]}!
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                  Ready to continue managing your operations? Access your dashboard, 
                  manage tasks, or explore the latest features available to your role.
                </p>
              </div>

              {/* User Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#2FF9B5] mb-3">
                    {userProfile.role === 'admin' ? 'Admin' : 
                     userProfile.role === 'cs_manager' ? 'CS Manager' : 
                     userProfile.role === 'hr_manager' ? 'HR Manager' : 
                     userProfile.role === 'driver_management' ? 'Driver Manager' :
                     userProfile.role === 'manager' ? 'Manager' :
                     userProfile.role === 'employee' ? 'Employee' :
                     userProfile.role === 'viewer' ? 'Viewer' : userProfile.role}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Your Role</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#FF51EB] mb-3">
                    {userProfile.department || 'Unassigned'}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Department</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold text-[#2562CF] mb-3">
                    {userProfile.position || 'Employee'}
                  </div>
                  <div className="text-gray-600 text-base font-medium">Position</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {/* Suggestion Box */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Lightbulb className="w-8 h-8 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Share Your Ideas</h2>
                    </div>
                    <Button
                      onClick={() => setShowSuggestionForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Suggestion</span>
                    </Button>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Have an idea to improve our organization? Share your suggestions for processes, 
                    technology, communication, or any other area.
                  </p>
                  
                  {/* Recent Suggestions */}
                  {recentSuggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Recent Suggestions</h3>
                      {recentSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                {suggestion.suggestion_type === 'user_specific' ? (
                                  <span className="flex items-center space-x-1 text-blue-600 text-xs">
                                    <Target className="w-3 h-3" />
                                    <span>For: {suggestion.target_user_name}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center space-x-1 text-green-600 text-xs">
                                    <Globe className="w-3 h-3" />
                                    <span>General</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleVote(suggestion.id, 'upvote')}
                                className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{suggestion.upvotes || 0}</span>
                              </button>
                              <button
                                onClick={() => handleVote(suggestion.id, 'downvote')}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{suggestion.downvotes || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Navigation */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Navigation</h2>
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate('/suggestions')}
                      className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">View All Suggestions</div>
                          <div className="text-sm text-gray-600">Browse and manage suggestions</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleDashboardClick}
                      className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">Go to Dashboard</div>
                          <div className="text-sm text-gray-600">Access your main workspace</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature showcase */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">System Features</h2>
                <div className="relative h-96 w-full">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentFeature
                          ? 'opacity-100 scale-100 rotate-0'
                          : 'opacity-0 scale-95 rotate-3'
                      }`}
                    >
                      <div className={`h-full w-full bg-gradient-to-br ${feature.color} rounded-3xl p-10 flex flex-col items-center justify-center text-center text-white shadow-2xl`}>
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
                          <feature.icon className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                        <p className="text-white/90 leading-relaxed text-lg">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature indicators */}
                <div className="flex justify-center space-x-4 mt-10">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleFeatureClick(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? 'bg-[#2FF9B5] scale-125'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Play/Pause control */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Play className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Form Modal */}
        {showSuggestionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Submit a Suggestion</h2>
                  <button
                    onClick={() => {
                      setShowSuggestionForm(false);
                      resetSuggestionForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSuggestionSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={suggestionForm.title}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of your suggestion"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={suggestionForm.description}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed explanation of your suggestion"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        value={suggestionForm.category}
                        onChange={(e) => setSuggestionForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.name} value={category.name}>{category.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={suggestionForm.priority}
                        onChange={(e) => setSuggestionForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Suggestion Type</Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="general"
                          checked={suggestionForm.suggestion_type === 'general'}
                          onChange={() => handleSuggestionTypeChange('general')}
                          className="text-blue-600"
                        />
                        <span className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>General (Visible to all)</span>
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="user_specific"
                          checked={suggestionForm.suggestion_type === 'user_specific'}
                          onChange={() => handleSuggestionTypeChange('user_specific')}
                          className="text-blue-600"
                        />
                        <span className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>User Specific</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {suggestionForm.suggestion_type === 'user_specific' && (
                    <div>
                      <Label htmlFor="target_user">Target User</Label>
                      <select
                        id="target_user"
                        value={suggestionForm.target_user_id}
                        onChange={(e) => handleTargetUserChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} - {user.department} ({user.position})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={suggestionForm.anonymous}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, anonymous: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <Label htmlFor="anonymous">Submit anonymously</Label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowSuggestionForm(false);
                        resetSuggestionForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Submit Suggestion
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Team Chat Component for logged-in users */}
        <WelcomeChat />
      </div>
    );
  }

  // Non-logged in user - show full-screen welcome page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14143A] via-[#2125DA] to-[#2562CF] overflow-hidden">
      {/* Welcome Navbar */}
      <WelcomeNavbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            backgroundSize: '400px 400px'
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo and Brand */}
            <div className="flex justify-center items-center mb-8">
              <img src="/Udrivehub.png" alt="U Drive Logo" className="h-20 w-auto mr-4" />
              <div className="text-left">
                <h1 className="text-6xl font-bold tracking-tight mb-2">
                  U Drive
                </h1>
                <p className="text-xl text-blue-200">
                  Comprehensive Fleet & HR Management Platform
                </p>
              </div>
            </div>
            
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
              Streamline your operations with our integrated platform for fleet management, 
              HR operations, analytics, and task management. Built for modern businesses.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSuggestionForm(true)}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-5 h-5" />
                Share Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature showcase */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 mx-4 my-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">System Features</h2>
        <div className="relative h-96 w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentFeature
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-95 rotate-3'
              }`}
            >
              <div className={`h-full w-full bg-gradient-to-br ${feature.color} rounded-3xl p-10 flex flex-col items-center justify-center text-center text-white shadow-2xl`}>
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
                  <feature.icon className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/90 leading-relaxed text-lg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature indicators */}
        <div className="flex justify-center space-x-4 mt-10">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => handleFeatureClick(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? 'bg-[#2FF9B5] scale-125'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Play/Pause control */}
      <div className="flex justify-center mt-8 mb-8">
        <button
          onClick={togglePlayPause}
          className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-gray-600" />
          ) : (
            <Play className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Suggestion Form Modal */}
      {showSuggestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit a Suggestion</h2>
                <button
                  onClick={() => {
                    setShowSuggestionForm(false);
                    resetSuggestionForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSuggestionSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={suggestionForm.title}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of your suggestion"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={suggestionForm.description}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed explanation of your suggestion"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={suggestionForm.category}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={suggestionForm.priority}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Suggestion Type</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="general"
                        checked={suggestionForm.suggestion_type === 'general'}
                        onChange={() => handleSuggestionTypeChange('general')}
                        className="text-blue-600"
                      />
                      <span className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <span>General (Visible to all)</span>
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="user_specific"
                        checked={suggestionForm.suggestion_type === 'user_specific'}
                        onChange={() => handleSuggestionTypeChange('user_specific')}
                        className="text-blue-600"
                      />
                      <span className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>User Specific</span>
                      </span>
                    </label>
                  </div>
                </div>

                {suggestionForm.suggestion_type === 'user_specific' && (
                  <div>
                    <Label htmlFor="target_user">Target User</Label>
                    <select
                      id="target_user"
                      value={suggestionForm.target_user_id}
                      onChange={(e) => handleTargetUserChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} - {user.department} ({user.position})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={suggestionForm.anonymous}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, anonymous: e.target.checked }))}
                    className="text-blue-600"
                  />
                  <Label htmlFor="anonymous">Submit anonymously</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSuggestionForm(false);
                      resetSuggestionForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Submit Suggestion
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Chat Component */}
      <WelcomeChat />
    </div>
  );
};

export default Welcome;


