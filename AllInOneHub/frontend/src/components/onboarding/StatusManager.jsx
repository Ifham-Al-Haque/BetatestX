import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Clock, AlertTriangle, Pause, 
  Play, RotateCcw, Save, X 
} from 'lucide-react';

export default function StatusManager({ 
  currentStatus, 
  onStatusChange, 
  onClose,
  employeeName 
}) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const statusOptions = [
    {
      value: 'pending',
      label: 'Pending',
      description: 'Onboarding process has not started yet',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200'
    },
    {
      value: 'in_progress',
      label: 'In Progress',
      description: 'Onboarding process is currently active',
      icon: Play,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      value: 'on_hold',
      label: 'On Hold',
      description: 'Onboarding process is temporarily paused',
      icon: Pause,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200'
    },
    {
      value: 'completed',
      label: 'Completed',
      description: 'Onboarding process has been finished',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200'
    }
  ];

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      console.log('Status unchanged, closing modal');
      onClose();
      return;
    }

    setLoading(true);
    try {
      console.log('Updating status to:', selectedStatus);
      await onStatusChange(selectedStatus, notes);
      console.log('Status updated successfully, closing modal');
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      // Don't close modal on error so user can see the error message
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Cancel clicked, closing modal');
    onClose();
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const currentStatusInfo = getStatusInfo(currentStatus);
  const selectedStatusInfo = getStatusInfo(selectedStatus);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Update Status</h2>
              <p className="text-sm text-gray-600">Change onboarding status for {employeeName}</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Status</h3>
            <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${currentStatusInfo.bgColor} ${currentStatusInfo.borderColor}`}>
              <currentStatusInfo.icon className={`w-6 h-6 ${currentStatusInfo.color}`} />
              <div>
                <p className={`font-medium ${currentStatusInfo.color}`}>
                  {currentStatusInfo.label}
                </p>
                <p className="text-sm text-gray-600">
                  {currentStatusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select New Status</h3>
            <div className="space-y-3">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                const isSelected = selectedStatus === status.value;
                
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? `${status.bgColor} ${status.borderColor} ring-2 ring-blue-500 ring-opacity-50`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? status.color : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? status.color : 'text-gray-900'}`}>
                        {status.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {status.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Change Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Change Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Status Change Preview */}
          {selectedStatus !== currentStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Status Change Preview</span>
              </div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">{currentStatusInfo.label}</span> → <span className="font-medium">{selectedStatusInfo.label}</span>
              </p>
              {notes && (
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Notes:</span> {notes}
                </p>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusChange}
              disabled={loading || selectedStatus === currentStatus}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Updating...' : 'Update Status'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
