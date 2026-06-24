import React from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb, XCircle, Globe, Target, Shield, Award,
} from 'lucide-react';
import HRCommentThread from '../hr/HRCommentThread';
import SuggestionVotePoll from './SuggestionVotePoll';
import {
  SUGGESTION_STATUSES,
  getSuggestionStatusColor,
  getSuggestionPriorityColor,
  formatStatusLabel,
} from '../../config/hrPanelConfig';
import { formatPriorityLabel } from '../../utils/suggestionHelpers';

const SuggestionDetailModal = ({
  suggestion,
  user,
  userVote = null,
  voting = false,
  onClose,
  onVote,
  onEdit,
  canEdit,
}) => {
  if (!suggestion) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionStatusColor(suggestion.status)}`}>
                {formatStatusLabel(suggestion.status)}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionPriorityColor(suggestion.priority)}`}>
                {formatPriorityLabel(suggestion.priority)}
              </span>
              {suggestion.status === 'implemented' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border border-green-300 bg-green-50 text-green-700">
                  <Award className="w-3 h-3" />
                  Adopted
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{suggestion.title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{suggestion.category}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:opacity-80" style={{ background: 'var(--bg-tertiary)' }}>
            <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)' }}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
              {suggestion.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Submitted by</p>
              <p className="inline-flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                {suggestion.anonymous && <Shield className="w-3.5 h-3.5" />}
                {suggestion.anonymous ? 'Anonymous' : suggestion.suggester_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type</p>
              <p className="inline-flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                {suggestion.suggestion_type === 'user_specific' ? (
                  <><Target className="w-3.5 h-3.5" /> For: {suggestion.target_user_name || 'Unknown'}</>
                ) : (
                  <><Globe className="w-3.5 h-3.5" /> General</>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Submitted</p>
              <p style={{ color: 'var(--text-primary)' }}>{new Date(suggestion.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
              <p style={{ color: 'var(--text-primary)' }}>
                {SUGGESTION_STATUSES.find((s) => s.value === suggestion.status)?.label || formatStatusLabel(suggestion.status)}
              </p>
            </div>
          </div>

          <SuggestionVotePoll
            upvotes={suggestion.upvotes}
            downvotes={suggestion.downvotes}
            userVote={userVote}
            onVote={(type) => onVote(suggestion.id, type)}
            disabled={voting}
          />

          <HRCommentThread
            entityType="suggestion"
            entityId={suggestion.id}
            canReply={suggestion.suggester_id === user?.id}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              Close
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => { onEdit(suggestion); onClose(); }}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
              >
                Edit Suggestion
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuggestionDetailModal;
