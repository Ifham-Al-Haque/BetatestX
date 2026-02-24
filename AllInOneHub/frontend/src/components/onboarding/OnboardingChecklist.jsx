import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Circle, Clock, AlertTriangle, Target, 
  Award, GraduationCap, Building, Shield, Monitor, Briefcase,
  Plus, Edit, Trash, User, Calendar
} from 'lucide-react';
import AddChecklistItemModal from './AddChecklistItemModal';

export default function OnboardingChecklist({ items, onUpdate, onAddItem, employeeId }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = {
    documentation: {
      title: 'Documentation',
      icon: Shield,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600'
    },
    it_setup: {
      title: 'IT Setup',
      icon: Monitor,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600'
    },
    hr_orientation: {
      title: 'HR Orientation',
      icon: Building,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600'
    },
    department_integration: {
      title: 'Department Integration',
      icon: Target,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      iconColor: 'text-orange-600'
    },
    training_compliance: {
      title: 'Training & Compliance',
      icon: GraduationCap,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      iconColor: 'text-indigo-600'
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-3 h-3" />;
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleItemToggle = async (item) => {
    await onUpdate(item.id, !item.is_completed);
  };

  const handleAddItem = (category) => {
    setSelectedCategory(category);
    setShowAddItem(true);
  };

  const handleSaveItem = async (itemData) => {
    if (onAddItem) {
      await onAddItem(itemData);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Calculate category stats
  const getCategoryStats = (categoryItems) => {
    const total = categoryItems.length;
    const completed = categoryItems.filter(item => item.is_completed).length;
    const overdue = categoryItems.filter(item => {
      if (item.is_completed) return false;
      const daysUntilDue = getDaysUntilDue(item.due_date);
      return daysUntilDue !== null && daysUntilDue < 0;
    }).length;
    
    return { total, completed, overdue };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Onboarding Checklist</h3>
          <p className="text-sm text-gray-600">
            {items.filter(item => item.is_completed).length} of {items.length} tasks completed
          </p>
        </div>
        <button
          onClick={() => setShowAddItem(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round((items.filter(item => item.is_completed).length / items.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(items.filter(item => item.is_completed).length / items.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
          const categoryItems = groupedItems[categoryKey] || [];
          const stats = getCategoryStats(categoryItems);
          const isExpanded = expandedCategories[categoryKey];
          const Icon = categoryInfo.icon;

          return (
            <div key={categoryKey} className="bg-white border border-gray-200 rounded-lg">
              {/* Category Header */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                      <Icon className={`w-5 h-5 ${categoryInfo.iconColor}`} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">{categoryInfo.title}</h4>
                      <p className="text-sm text-gray-600">
                        {stats.completed}/{stats.total} completed
                        {stats.overdue > 0 && (
                          <span className="text-red-600 ml-2">• {stats.overdue} overdue</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round((stats.completed / stats.total) * 100)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                
                {/* Add Item Button */}
                <button
                  onClick={() => handleAddItem(categoryKey)}
                  className="ml-3 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title={`Add item to ${categoryInfo.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Category Items */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4 space-y-3">
                    {categoryItems.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No items in this category</p>
                      </div>
                    ) : (
                      categoryItems.map((item, index) => {
                        const daysUntilDue = getDaysUntilDue(item.due_date);
                        const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !item.is_completed;
                        
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                              item.is_completed 
                                ? 'bg-green-50 border-green-200' 
                                : isOverdue 
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => handleItemToggle(item)}
                              className={`mt-1 transition-colors duration-200 ${
                                item.is_completed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {item.is_completed ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            {/* Item Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className={`font-medium ${
                                    item.is_completed ? 'text-green-900 line-through' : 'text-gray-900'
                                  }`}>
                                    {item.checklist_item}
                                  </h5>
                                  {item.description && (
                                    <p className={`text-sm mt-1 ${
                                      item.is_completed ? 'text-green-700' : 'text-gray-600'
                                    }`}>
                                      {item.description}
                                    </p>
                                  )}
                                  
                                  {/* Metadata */}
                                  <div className="flex items-center space-x-4 mt-2">
                                    {/* Priority */}
                                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                                      {getPriorityIcon(item.priority)}
                                      <span>{item.priority}</span>
                                    </div>

                                    {/* Due Date */}
                                    {item.due_date && (
                                      <div className="flex items-center space-x-1 text-xs">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className={isOverdue ? 'text-red-600' : 'text-gray-500'}>
                                          Due: {formatDate(item.due_date)}
                                        </span>
                                        {isOverdue && (
                                          <span className="text-red-600 font-medium">
                                            ({Math.abs(daysUntilDue)} days overdue)
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Assigned To */}
                                    {item.assigned_to_employee && (
                                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <User className="w-3 h-3" />
                                        <span>Assigned to {item.assigned_to_employee.full_name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Completion Info */}
                                  {item.is_completed && (
                                    <div className="mt-2 text-xs text-green-600">
                                      Completed by {item.completed_by_employee?.full_name || 'Unknown'} 
                                      {item.completed_at && ` on ${formatDate(item.completed_at)}`}
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {item.notes && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                                      <strong>Notes:</strong> {item.notes}
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    title="Edit item"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                    title="Delete item"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{items.length}</div>
            <div className="text-sm text-blue-700">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {items.filter(item => item.is_completed).length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-900">
              {items.filter(item => !item.is_completed && getDaysUntilDue(item.due_date) !== null && getDaysUntilDue(item.due_date) <= 3).length}
            </div>
            <div className="text-sm text-yellow-700">Due Soon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-900">
              {items.filter(item => !item.is_completed && getDaysUntilDue(item.due_date) !== null && getDaysUntilDue(item.due_date) < 0).length}
            </div>
            <div className="text-sm text-red-700">Overdue</div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <AddChecklistItemModal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setSelectedCategory(null);
        }}
        onSave={handleSaveItem}
        category={selectedCategory}
        employeeId={employeeId}
      />
    </div>
  );
}
