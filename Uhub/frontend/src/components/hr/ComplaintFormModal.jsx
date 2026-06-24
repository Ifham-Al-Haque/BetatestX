import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Shield,
  Lock,
  Send,
  Loader2,
  Building,
  Users,
  CreditCard,
  User,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from '../../config/hrPanelConfig';

const CATEGORY_META = {
  'Work Environment': { icon: Building, hint: 'Office conditions, culture, or facilities' },
  'Harassment & Misconduct': { icon: AlertTriangle, hint: 'Inappropriate behavior or misconduct' },
  Discrimination: { icon: Users, hint: 'Unfair treatment based on protected characteristics' },
  'Pay & Benefits': { icon: CreditCard, hint: 'Salary, benefits, or compensation issues' },
  'Management Issues': { icon: User, hint: 'Leadership, supervision, or management concerns' },
  'Safety Concerns': { icon: Shield, hint: 'Health, safety, or security at work' },
  Other: { icon: FileText, hint: 'Anything not covered above' },
};

const PRIORITY_STYLES = {
  low: { ring: 'ring-green-500', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  medium: { ring: 'ring-amber-500', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  high: { ring: 'ring-orange-500', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  urgent: { ring: 'ring-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  anonymous: false,
};

const ComplaintFormModal = ({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingComplaint = null,
  submitting = false,
}) => {
  const categories = COMPLAINT_CATEGORIES;
  const priorities = COMPLAINT_PRIORITIES;
  const descLength = formData.description?.length || 0;
  const isValid = formData.title.trim() && formData.category && formData.description.trim();

  const completionSteps = useMemo(() => {
    let done = 0;
    if (formData.title.trim()) done += 1;
    if (formData.category) done += 1;
    if (formData.description.trim().length >= 20) done += 1;
    return done;
  }, [formData]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complaint-form-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border flex flex-col"
            style={{
              background: 'var(--card-bg, #fff)',
              borderColor: 'var(--card-border, rgba(0,0,0,0.08))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 opacity-95" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />

              <div className="relative px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-1 ring-white/30">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">
                        Confidential report
                      </p>
                      <h2 id="complaint-form-title" className="text-2xl sm:text-3xl font-bold text-white">
                        {editingComplaint ? 'Edit complaint' : 'Submit a complaint'}
                      </h2>
                      <p className="text-red-50/90 text-sm mt-1.5 max-w-md">
                        {editingComplaint
                          ? 'Update your complaint while it is still open.'
                          : 'Your report is handled by HR with care. Only share what you are comfortable with.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mini progress */}
                {!editingComplaint && (
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(completionSteps / 3) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/90 whitespace-nowrap">
                      {completionSteps}/3 complete
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6 sm:px-8 sm:py-7">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isValid && !submitting) onSubmit(e);
                }}
                className="space-y-8"
              >
                {/* Trust banner */}
                <div
                  className="flex gap-3 p-4 rounded-2xl border"
                  style={{
                    background: 'var(--bg-tertiary, #f9fafb)',
                    borderColor: 'var(--border-primary, #e5e7eb)',
                  }}
                >
                  <div className="p-2 rounded-xl bg-emerald-100 shrink-0">
                    <Lock className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111)' }}>
                      Your privacy matters
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted, #6b7280)' }}>
                      HR reviews every submission. Enable anonymous mode below if you prefer your name hidden from management.
                    </p>
                  </div>
                </div>

                {/* Title */}
                <section className="space-y-2">
                  <label htmlFor="complaint-title" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <Sparkles className="w-4 h-4 text-red-500" />
                    What is this about?
                  </label>
                  <input
                    id="complaint-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Unfair treatment in team meetings"
                    maxLength={120}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                    style={{
                      borderColor: 'var(--border-primary, #d1d5db)',
                      background: 'var(--bg-primary, #fff)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                    {formData.title.length}/120
                  </p>
                </section>

                {/* Category grid */}
                <section className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <Building className="w-4 h-4 text-red-500" />
                    Category
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categories.map((cat) => {
                      const meta = CATEGORY_META[cat] || { icon: FileText, hint: '' };
                      const Icon = meta.icon;
                      const selected = formData.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`relative text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                            selected
                              ? 'border-red-500 bg-red-50/80 shadow-md ring-2 ring-red-500/20'
                              : 'border-transparent hover:border-red-200 hover:bg-red-50/40'
                          }`}
                          style={
                            !selected
                              ? {
                                  background: 'var(--bg-tertiary, #f9fafb)',
                                  borderColor: 'var(--border-primary, #e5e7eb)',
                                }
                              : undefined
                          }
                        >
                          {selected && (
                            <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-red-500" />
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selected ? 'bg-red-100' : 'bg-gray-100'}`}>
                              <Icon className={`w-4 h-4 ${selected ? 'text-red-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="min-w-0 pr-4">
                              <p className={`text-sm font-semibold ${selected ? 'text-red-900' : ''}`} style={!selected ? { color: 'var(--text-primary)' } : undefined}>
                                {cat}
                              </p>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                {meta.hint}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Priority */}
                <section className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    How urgent is this?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {priorities.map((p) => {
                      const selected = formData.priority === p.value;
                      const style = PRIORITY_STYLES[p.value] || PRIORITY_STYLES.medium;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.value })}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            selected ? `${style.bg} ${style.ring} ring-2 ring-offset-1` : 'border-transparent'
                          }`}
                          style={
                            !selected
                              ? {
                                  background: 'var(--bg-tertiary)',
                                  borderColor: 'var(--border-primary)',
                                }
                              : undefined
                          }
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Description */}
                <section className="space-y-2">
                  <label htmlFor="complaint-description" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <FileText className="w-4 h-4 text-red-500" />
                    Tell us what happened
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="complaint-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Include dates, people involved (if comfortable), and how this affected you. The more detail HR has, the better they can help."
                    rows={5}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border text-sm resize-none transition-all focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{descLength < 20 ? 'At least 20 characters recommended' : 'Good level of detail'}</span>
                    <span>{descLength} characters</span>
                  </div>
                </section>

                {/* Anonymous toggle card */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, anonymous: !formData.anonymous })}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    formData.anonymous
                      ? 'border-red-400 bg-red-50/60 ring-2 ring-red-500/15'
                      : 'border-dashed hover:border-red-200'
                  }`}
                  style={
                    !formData.anonymous
                      ? {
                          borderColor: 'var(--border-primary)',
                          background: 'var(--bg-tertiary)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${formData.anonymous ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <Shield className={`w-5 h-5 ${formData.anonymous ? 'text-red-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Submit anonymously
                        </p>
                        <div
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            formData.anonymous ? 'bg-red-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              formData.anonymous ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {formData.anonymous
                          ? 'Your name will be hidden from HR management. HR can still follow up via this ticket.'
                          : 'Your name will be visible to HR handling this complaint.'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Actions */}
                <div
                  className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={!isValid || submitting}
                    whileHover={isValid && !submitting ? { scale: 1.02 } : {}}
                    whileTap={isValid && !submitting ? { scale: 0.98 } : {}}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {editingComplaint ? 'Save changes' : 'Submit complaint'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { EMPTY_FORM as COMPLAINT_FORM_DEFAULTS };
export default ComplaintFormModal;
