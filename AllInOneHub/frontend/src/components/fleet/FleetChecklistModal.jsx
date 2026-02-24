import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  Circle, 
  User, 
  Calendar, 
  MessageSquare, 
  FileText,
  Car,
  Shield,
  Smartphone,
  Settings,
  Palette,
  CreditCard,
  Award,
  AlertCircle,
  Clock,
  CheckSquare,
  Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import fleetOnboardingService from '../../services/fleetOnboardingService';

const FleetChecklistModal = ({ isOpen, onClose, vehicle, onSuccess }) => {
  const { userProfile } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [notes, setNotes] = useState({});
  const [showNoteInput, setShowNoteInput] = useState({});

  const checklistItems = [
    {
      key: 'car_registration',
      title: 'Car Registration',
      description: 'Complete vehicle registration with authorities',
      icon: FileText,
      color: 'blue'
    },
    {
      key: 'passing_certificate',
      title: 'Passing Certificate',
      description: 'Obtain vehicle passing/inspection certificate',
      icon: Shield,
      color: 'green'
    },
    {
      key: 'iot_device_installation',
      title: 'IoT Device Installation',
      description: 'Install and test IoT tracking device',
      icon: Smartphone,
      color: 'purple'
    },
    {
      key: 'device_configuration',
      title: 'Device Configuration',
      description: 'Configure IoT device settings and connectivity',
      icon: Settings,
      color: 'indigo'
    },
    {
      key: 'branding_completed',
      title: 'Vehicle Branding',
      description: 'Apply company branding, logos, and decals',
      icon: Palette,
      color: 'pink'
    },
    {
      key: 'salik_tag_installed',
      title: 'Salik Tag Installation',
      description: 'Install and activate Salik toll tag',
      icon: CreditCard,
      color: 'orange'
    },
    {
      key: 'vip_chip_installed',
      title: 'VIP Chip Installation',
      description: 'Install VIP access chip/card',
      icon: Award,
      color: 'yellow'
    }
  ];

  useEffect(() => {
    if (isOpen && vehicle) {
      loadChecklistData();
    }
  }, [isOpen, vehicle]);

  const loadChecklistData = async () => {
    try {
      setLoading(true);
      const [checklistData, historyData] = await Promise.all([
        fleetOnboardingService.getVehicleChecklist(vehicle.id),
        fleetOnboardingService.getVehicleOnboardingHistory(vehicle.id)
      ]);
      
      setChecklist(checklistData);
      setHistory(historyData);
      
      // Initialize notes from existing data
      const initialNotes = {};
      checklistItems.forEach(item => {
        const noteField = `${item.key}_notes`;
        if (checklistData[noteField]) {
          initialNotes[item.key] = checklistData[noteField];
        }
      });
      setNotes(initialNotes);
    } catch (error) {
      console.error('Error loading checklist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = async (itemKey) => {
    if (!checklist || updating[itemKey]) return;

    try {
      setUpdating(prev => ({ ...prev, [itemKey]: true }));
      
      const newStatus = !checklist[itemKey];
      const itemNotes = notes[itemKey] || '';
      
      await fleetOnboardingService.updateChecklistItem(
        vehicle.id,
        itemKey,
        newStatus,
        userProfile?.id,
        itemNotes
      );

      // Reload data to get updated progress
      await loadChecklistData();
      
      // Notify parent component
      onSuccess?.();
    } catch (error) {
      console.error('Error updating checklist item:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleNoteChange = (itemKey, value) => {
    setNotes(prev => ({ ...prev, [itemKey]: value }));
  };

  const handleNoteSave = async (itemKey) => {
    try {
      const itemNotes = notes[itemKey] || '';
      
      await fleetOnboardingService.updateChecklistItem(
        vehicle.id,
        itemKey,
        checklist[itemKey], // Keep current status
        userProfile?.id,
        itemNotes
      );

      setShowNoteInput(prev => ({ ...prev, [itemKey]: false }));
      await loadChecklistData();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const getItemStatus = (itemKey) => {
    if (!checklist) return false;
    return checklist[itemKey] || false;
  };

  const getCompletedBy = (itemKey) => {
    if (!checklist) return null;
    const completedByField = `${itemKey}_completed_by_employee`;
    return checklist[completedByField];
  };

  const getCompletedAt = (itemKey) => {
    if (!checklist) return null;
    const completedAtField = `${itemKey}_completed_at`;
    return checklist[completedAtField];
  };

  const getColorClasses = (color, isCompleted) => {
    const colors = {
      blue: isCompleted ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-50 text-blue-600 border-blue-100',
      green: isCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-50 text-green-600 border-green-100',
      purple: isCompleted ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-50 text-purple-600 border-purple-100',
      indigo: isCompleted ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100',
      pink: isCompleted ? 'bg-pink-100 text-pink-800 border-pink-200' : 'bg-pink-50 text-pink-600 border-pink-100',
      orange: isCompleted ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-50 text-orange-600 border-orange-100',
      yellow: isCompleted ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = () => {
    if (!checklist) return 0;
    const completedItems = checklistItems.filter(item => checklist[item.key]).length;
    return Math.round((completedItems / checklistItems.length) * 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Fleet Onboarding Checklist
                  </h2>
                  <p className="text-green-100 text-sm">
                    {vehicle?.vehicle_number} - {vehicle?.make} {vehicle?.model}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{calculateProgress()}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{checklistItems.filter(item => checklist?.[item.key]).length} completed</span>
              <span>{checklistItems.length - checklistItems.filter(item => checklist?.[item.key]).length} remaining</span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Checklist Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading checklist...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {checklistItems.map((item, index) => {
                    const ItemIcon = item.icon;
                    const isCompleted = getItemStatus(item.key);
                    const completedBy = getCompletedBy(item.key);
                    const completedAt = getCompletedAt(item.key);
                    const isUpdating = updating[item.key];

                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-2xl border-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleItemToggle(item.key)}
                                disabled={isUpdating}
                                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${getColorClasses(item.color, isCompleted)}`}
                              >
                                {isUpdating ? (
                                  <Loader className="w-5 h-5 animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : (
                                  <ItemIcon className="w-6 h-6" />
                                )}
                              </button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className={`text-lg font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                                  {item.title}
                                </h3>
                                {isCompleted && (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Completed
                                  </div>
                                )}
                              </div>
                              
                              <p className={`text-sm mb-3 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                                {item.description}
                              </p>

                              {/* Completion Info */}
                              {isCompleted && completedBy && (
                                <div className="bg-green-100 rounded-xl p-3 mb-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-green-800">
                                      <User className="w-4 h-4 mr-1" />
                                      Completed by {completedBy.full_name}
                                    </div>
                                    <div className="flex items-center text-green-700">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {formatDate(completedAt)}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Notes Section */}
                              <div className="space-y-2">
                                {notes[item.key] && !showNoteInput[item.key] && (
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-start space-x-2">
                                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-700">{notes[item.key]}</p>
                                        <button
                                          onClick={() => setShowNoteInput(prev => ({ ...prev, [item.key]: true }))}
                                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                          Edit note
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(!notes[item.key] || showNoteInput[item.key]) && (
                                  <div className="space-y-2">
                                    <textarea
                                      placeholder={`Add notes for ${item.title}...`}
                                      value={notes[item.key] || ''}
                                      onChange={(e) => handleNoteChange(item.key, e.target.value)}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleNoteSave(item.key)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        Save Note
                                      </button>
                                      {showNoteInput[item.key] && (
                                        <button
                                          onClick={() => setShowNoteInput(prev => ({ ...prev, [item.key]: false }))}
                                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History Sidebar */}
            <div className="w-80 bg-gray-50 border-l overflow-y-auto">
              <div className="p-4 border-b bg-white">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Activity History
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No activity recorded yet
                  </p>
                ) : (
                  history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl p-3 border border-gray-200"
                    >
                      <div className="flex items-start space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          entry.action === 'Completed' ? 'bg-green-100 text-green-800' :
                          entry.action === 'Started' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.action === 'Completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : entry.action === 'Started' ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.checklist_item}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {entry.action} by {entry.performed_by_employee?.full_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(entry.performed_at)}
                          </div>
                          {entry.description && entry.description !== `${entry.checklist_item} ${entry.action.toLowerCase()}` && (
                            <div className="text-xs text-gray-600 mt-2 bg-gray-50 rounded p-2">
                              {entry.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {checklist?.all_items_completed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    All checklist items completed! Vehicle ready for service.
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                    {checklistItems.length - checklistItems.filter(item => checklist?.[item.key]).length} items remaining
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FleetChecklistModal;
