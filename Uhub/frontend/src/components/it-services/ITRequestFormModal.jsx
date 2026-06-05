import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, RefreshCw, Send, FileText, CheckCircle2 } from 'lucide-react';
import Button from '../ui/button';
import Input from '../ui/input';
import Label from '../ui/label';
import Textarea from '../ui/textarea';
import {
  getCategoryIcon,
  CATEGORY_TITLE_HINTS,
  PRIORITY_VISUAL,
  CATEGORY_SUB_OPTIONS,
} from '../../constants/itServiceCategories';

const fieldStyle = {
  background: 'var(--bg-tertiary)',
  borderColor: 'var(--border-primary)',
  color: 'var(--text-primary)',
};

const ITRequestFormModal = ({
  open,
  onClose,
  editingRequest,
  formData,
  setFormData,
  categories,
  priorities,
  formSubmitting,
  onSubmit,
}) => {
  const [validationHint, setValidationHint] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(formData.category_id)),
    [categories, formData.category_id]
  );

  const selectedPriority = useMemo(
    () => priorities.find((p) => String(p.id) === String(formData.priority_id)),
    [priorities, formData.priority_id]
  );

  const titlePlaceholder = selectedCategory?.name
    ? (CATEGORY_TITLE_HINTS[selectedCategory.name] || 'Brief summary of your request')
    : 'Select a category first, then add a short title';

  const subOptions = selectedCategory?.name
    ? (CATEGORY_SUB_OPTIONS[selectedCategory.name] || [])
    : [];

  // Default to Medium priority when the form opens
  useEffect(() => {
    if (!open || formData.priority_id || priorities.length === 0) return;
    const medium =
      priorities.find((p) => String(p.name || '').toLowerCase() === 'medium') ||
      priorities[0];
    if (medium?.id) {
      setFormData((prev) => ({ ...prev, priority_id: medium.id }));
    }
  }, [open, priorities, formData.priority_id, setFormData]);

  useEffect(() => {
    if (open) setValidationHint('');
  }, [open]);

  const getValidationError = useCallback(() => {
    if (!formData.category_id) return 'Please select a category.';
    if (!formData.priority_id) return 'Please select a priority.';
    if (!formData.title?.trim()) return 'Please enter a request title.';
    if (!formData.description?.trim()) return 'Please describe your request in the details field.';
    return null;
  }, [formData]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const error = getValidationError();
    if (error) {
      setValidationHint(error);
      return;
    }
    setValidationHint('');
    onSubmit(e);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          {/* Header */}
          <div
            className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b shrink-0"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(8,145,178,0.06) 100%)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl shadow-md"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {editingRequest ? 'Edit Request' : 'New IT Service Request'}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {editingRequest ? 'Update your request details' : 'Choose a category, describe the issue, and set priority'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2 shrink-0">
                <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </Button>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-6">
            {/* Category picker */}
            <section>
              <Label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--text-primary)' }}>
                What do you need help with? <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Pick the category that best matches your request
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category);
                  const isSelected = String(formData.category_id) === String(category.id);
                  const accent = category.color || '#14b8a6';
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category_id: category.id, subcategory: '' })}
                      className="relative text-left rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        background: isSelected ? `${accent}14` : 'var(--bg-tertiary)',
                        borderColor: isSelected ? accent : 'var(--border-primary)',
                        boxShadow: isSelected ? `0 0 0 1px ${accent}40` : undefined,
                      }}
                    >
                      {isSelected && (
                        <CheckCircle2
                          className="absolute top-2 right-2 w-4 h-4"
                          style={{ color: accent }}
                        />
                      )}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                        style={{ background: `${accent}22`, color: accent }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold leading-tight pr-4" style={{ color: 'var(--text-primary)' }}>
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-[11px] leading-snug mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {category.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              {categories.length === 0 && (
                <p className="text-sm py-4 text-center rounded-lg border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}>
                  No categories available. Ask your admin to run the category update script.
                </p>
              )}
            </section>

            {/* Sub-type (when category has options) */}
            {subOptions.length > 0 && (
              <section>
                <Label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--text-primary)' }}>
                  Specific type <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </Label>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Narrow down your {selectedCategory?.name?.toLowerCase()} request — helps IT route faster
                </p>
                <div className="flex flex-wrap gap-2">
                  {subOptions.map((opt) => {
                    const isSelected = formData.subcategory === opt;
                    const accent = selectedCategory?.color || '#14b8a6';
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({ ...formData, subcategory: opt })}
                        className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                        style={{
                          background: isSelected ? `${accent}18` : 'var(--bg-tertiary)',
                          borderColor: isSelected ? accent : 'var(--border-primary)',
                          color: isSelected ? accent : 'var(--text-secondary)',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Title & description */}
            <section className="space-y-4">
              <div>
                <Label htmlFor="it-req-title" className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                  Request title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="it-req-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder={titlePlaceholder}
                  className="h-11"
                  style={fieldStyle}
                />
              </div>
              <div>
                <Label htmlFor="it-req-desc" className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                  Details <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="it-req-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Describe what you need, steps to reproduce (if applicable), and any urgency context..."
                  style={fieldStyle}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  {(formData.description || '').length} characters — include device name, location, or error messages if relevant
                </p>
              </div>
            </section>

            {/* Priority picker */}
            <section>
              <Label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--text-primary)' }}>
                Priority <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                How urgently does this need attention?
              </p>
              <div className="flex flex-col gap-2">
                {priorities.map((priority) => {
                  const visual = PRIORITY_VISUAL[priority.name] || PRIORITY_VISUAL.Medium;
                  const PIcon = visual.icon;
                  const isSelected = String(formData.priority_id) === String(priority.id);
                  return (
                    <button
                      key={priority.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority_id: priority.id })}
                      className="flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 hover:shadow-sm focus:outline-none"
                      style={{
                        background: isSelected ? visual.bg : 'var(--bg-tertiary)',
                        borderColor: isSelected ? visual.color : 'var(--border-primary)',
                      }}
                    >
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ background: isSelected ? visual.color : `${visual.color}33`, color: isSelected ? '#fff' : visual.color }}
                      >
                        <PIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {priority.name}
                        </p>
                        {priority.description && (
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {priority.description}
                            {priority.sla_hours ? ` · SLA ${priority.sla_hours}h` : ''}
                          </p>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: visual.color }} />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Summary strip */}
            {(selectedCategory || selectedPriority) && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex flex-wrap gap-2 items-center"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Summary:</span>
                {selectedCategory && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${selectedCategory.color}22`, color: selectedCategory.color }}
                  >
                    {selectedCategory.name}
                  </span>
                )}
                {formData.subcategory && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    {formData.subcategory}
                  </span>
                )}
                {selectedPriority && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: (PRIORITY_VISUAL[selectedPriority.name] || PRIORITY_VISUAL.Medium).bg,
                      color: (PRIORITY_VISUAL[selectedPriority.name] || PRIORITY_VISUAL.Medium).color,
                    }}
                  >
                    {selectedPriority.name}
                  </span>
                )}
              </div>
            )}
            </div>

            {/* Footer */}
            <div
              className="px-5 sm:px-6 py-4 border-t shrink-0"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--card-bg)' }}
            >
              {validationHint && (
                <p className="text-sm text-red-600 mb-3 text-right" role="alert">
                  {validationHint}
                </p>
              )}
              <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={formSubmitting} style={fieldStyle}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="text-white border-0 flex items-center gap-2 min-w-[140px] justify-center"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
                }}
              >
                {formSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ITRequestFormModal;
