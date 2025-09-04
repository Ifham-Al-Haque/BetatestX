import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, TrendingUp, Award, Calendar, CheckCircle, 
  Clock, AlertTriangle, Star, Plus, Edit, Trash2,
  BarChart3, PieChart, Activity
} from 'lucide-react';

const EmployeePerformance = ({ employeeId, employeeName }) => {
  const [performance, setPerformance] = useState({
    goals: [],
    reviews: [],
    metrics: {},
    achievements: []
  });
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium',
    category: 'work'
  });
  const [newReview, setNewReview] = useState({
    type: 'quarterly',
    rating: 5,
    feedback: '',
    areas_of_improvement: '',
    next_steps: ''
  });

  const goalCategories = ['work', 'personal', 'skill_development', 'leadership', 'project'];
  const goalPriorities = ['low', 'medium', 'high', 'critical'];
  const reviewTypes = ['monthly', 'quarterly', 'annual', 'project', 'performance'];

  useEffect(() => {
    fetchPerformanceData();
  }, [employeeId]);

  const fetchPerformanceData = async () => {
    // This would typically fetch from your database
    // For now, using mock data
    setLoading(false);
    setPerformance({
      goals: [
        {
          id: 1,
          title: 'Complete Advanced React Course',
          description: 'Finish the comprehensive React course to improve frontend skills',
          target_date: '2024-03-15',
          priority: 'high',
          category: 'skill_development',
          status: 'in_progress',
          progress: 75
        },
        {
          id: 2,
          title: 'Lead Team Project Successfully',
          description: 'Successfully manage and deliver the Q1 project on time',
          target_date: '2024-03-31',
          priority: 'critical',
          category: 'leadership',
          status: 'in_progress',
          progress: 60
        }
      ],
      reviews: [
        {
          id: 1,
          type: 'quarterly',
          rating: 4,
          feedback: 'Excellent work on the recent project. Shows strong leadership skills.',
          areas_of_improvement: 'Could improve time management for complex tasks',
          next_steps: 'Focus on project planning and delegation',
          date: '2024-01-15',
          reviewer: 'Manager Name'
        }
      ],
      metrics: {
        overall_rating: 4.2,
        goals_completed: 8,
        goals_in_progress: 3,
        goals_overdue: 1,
        reviews_count: 5,
        last_review_date: '2024-01-15'
      },
      achievements: [
        {
          id: 1,
          title: 'Employee of the Month',
          description: 'Recognized for outstanding performance in Q4 2023',
          date: '2023-12-01',
          type: 'recognition'
        }
      ]
    });
  };

  const addGoal = () => {
    if (newGoal.title && newGoal.description && newGoal.target_date) {
      const goal = {
        id: Date.now(),
        ...newGoal,
        status: 'not_started',
        progress: 0,
        created_at: new Date().toISOString()
      };
      setPerformance(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
      setNewGoal({
        title: '',
        description: '',
        target_date: '',
        priority: 'medium',
        category: 'work'
      });
      setShowAddGoal(false);
    }
  };

  const addReview = () => {
    if (newReview.feedback) {
      const review = {
        id: Date.now(),
        ...newReview,
        date: new Date().toISOString(),
        reviewer: 'Current User'
      };
      setPerformance(prev => ({
        ...prev,
        reviews: [...prev.reviews, review]
      }));
      setNewReview({
        type: 'quarterly',
        rating: 5,
        feedback: '',
        areas_of_improvement: '',
        next_steps: ''
      });
      setShowAddReview(false);
    }
  };

  const updateGoalProgress = (goalId, newProgress) => {
    setPerformance(prev => ({
      ...prev,
      goals: prev.goals.map(goal =>
        goal.id === goalId
          ? { ...goal, progress: Math.min(100, Math.max(0, newProgress)) }
          : goal
      )
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600">Track goals, reviews, and achievements for {employeeName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
          <button
            onClick={() => setShowAddReview(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Rating</p>
              <p className={`text-2xl font-bold ${getRatingColor(performance.metrics.overall_rating)}`}>
                {performance.metrics.overall_rating}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Goals Completed</p>
              <p className="text-2xl font-bold text-gray-900">{performance.metrics.goals_completed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{performance.metrics.goals_in_progress}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{performance.metrics.goals_overdue}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Goals Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Goals & Objectives</h3>
          <span className="text-sm text-gray-500">
            {performance.goals.length} total goals
          </span>
        </div>

        <div className="space-y-4">
          {performance.goals.map(goal => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Category: {goal.category.replace('_', ' ').toUpperCase()}</span>
                    <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                    className="w-20"
                  />
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Reviews</h3>
        
        <div className="space-y-4">
          {performance.reviews.map(review => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                    {review.type.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{review.feedback}</p>
              
              {review.areas_of_improvement && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Areas for Improvement
                  </p>
                  <p className="text-sm text-gray-700">{review.areas_of_improvement}</p>
                </div>
              )}
              
              {review.next_steps && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Next Steps
                  </p>
                  <p className="text-sm text-gray-700">{review.next_steps}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Recognition</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performance.achievements.map(achievement => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Goal</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Goal description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {goalPriorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {goalCategories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Performance Review</h3>
            
            <div className="space-y-4">
              <select
                value={newReview.type}
                onChange={(e) => setNewReview({ ...newReview, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {reviewTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Review
                  </option>
                ))}
              </select>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className={`p-2 rounded-lg ${
                        newReview.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                placeholder="Feedback"
                value={newReview.feedback}
                onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <textarea
                placeholder="Areas for improvement"
                value={newReview.areas_of_improvement}
                onChange={(e) => setNewReview({ ...newReview, areas_of_improvement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              
              <textarea
                placeholder="Next steps"
                value={newReview.next_steps}
                onChange={(e) => setNewReview({ ...newReview, next_steps: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddReview(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addReview}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformance;
