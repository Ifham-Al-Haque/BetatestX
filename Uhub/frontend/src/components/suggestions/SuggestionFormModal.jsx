import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, X, Globe, Target } from 'lucide-react';
import { SUGGESTION_PRIORITIES } from '../../config/hrPanelConfig';

const SuggestionFormModal = ({
  show,
  editingSuggestion,
  formData,
  setFormData,
  categories,
  users,
  onSubmit,
  onClose,
  onTypeChange,
  onTargetUserChange,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
              >
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingSuggestion ? 'Edit Suggestion' : 'New Suggestion'}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {editingSuggestion
                    ? 'Update your suggestion details'
                    : 'Share your innovative ideas with the team'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of your suggestion"
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed explanation of your suggestion"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-y"
                style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  {SUGGESTION_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Suggestion Type</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="general"
                    checked={formData.suggestion_type === 'general'}
                    onChange={() => onTypeChange('general')}
                    className="text-purple-600"
                  />
                  <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>General (visible to all)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="user_specific"
                    checked={formData.suggestion_type === 'user_specific'}
                    onChange={() => onTypeChange('user_specific')}
                    className="text-purple-600"
                  />
                  <Target className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>User Specific</span>
                </label>
              </div>
            </div>

            {formData.suggestion_type === 'user_specific' && (
              <div>
                <label htmlFor="target_user" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Target User *
                </label>
                <select
                  id="target_user"
                  value={formData.target_user_id}
                  onChange={(e) => onTargetUserChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} - {u.department} ({u.position})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.anonymous}
                onChange={(e) => setFormData((prev) => ({ ...prev, anonymous: e.target.checked }))}
                className="text-purple-600 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Submit anonymously</span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
              >
                {editingSuggestion ? 'Update Suggestion' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SuggestionFormModal;
