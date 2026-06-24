import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, User, MessageSquare,
  Edit, Trash2, Globe, Target, Eye, Award, Shield,
} from 'lucide-react';
import HRCommentThread from '../hr/HRCommentThread';
import SuggestionVotePoll from './SuggestionVotePoll';
import {
  getSuggestionStatusColor,
  getSuggestionPriorityColor,
  formatStatusLabel,
} from '../../config/hrPanelConfig';
import {
  formatPriorityLabel,
  formatSuggestionDate,
  canEditSuggestion,
} from '../../utils/suggestionHelpers';

const SuggestionBadges = ({ suggestion, categoryColorMap }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionPriorityColor(suggestion.priority)}`}>
      {formatPriorityLabel(suggestion.priority)}
    </span>
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSuggestionStatusColor(suggestion.status)}`}>
      {formatStatusLabel(suggestion.status)}
    </span>
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${categoryColorMap[suggestion.category] || ''}`}>
      {suggestion.category}
    </span>
    {suggestion.suggestion_type === 'user_specific' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700">
        <Target className="w-3 h-3" />
        For: {suggestion.target_user_name || 'User'}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700">
        <Globe className="w-3 h-3" />
        General
      </span>
    )}
    {suggestion.anonymous && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
        <Shield className="w-3 h-3" />
        Anonymous
      </span>
    )}
    {suggestion.status === 'implemented' && (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border border-green-300 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700">
        <Award className="w-3 h-3" />
        Adopted
      </span>
    )}
  </div>
);

const SuggestionCard = ({
  suggestion,
  index = 0,
  viewMode = 'grid',
  user,
  userProfile,
  categoryColorMap,
  userVote = null,
  voting = false,
  expandedThreadId,
  onToggleThread,
  onVote,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const editable = canEditSuggestion(suggestion, user, userProfile);
  const threadOpen = expandedThreadId === suggestion.id;

  const metaRow = (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span className="inline-flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formatSuggestionDate(suggestion.created_at)}
      </span>
      {!suggestion.anonymous && (
        <span className="inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          {suggestion.suggester_name}
        </span>
      )}
    </div>
  );

  const pollSection = (
    <SuggestionVotePoll
      upvotes={suggestion.upvotes}
      downvotes={suggestion.downvotes}
      userVote={userVote}
      onVote={(type) => onVote(suggestion.id, type)}
      disabled={voting}
      compact={viewMode === 'list'}
    />
  );

  const actionsRow = (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
      <button
        type="button"
        onClick={() => onToggleThread(suggestion.id)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {threadOpen ? 'Hide' : 'HR'} responses
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onViewDetail(suggestion)}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
        {editable && (
          <>
            <button
              type="button"
              onClick={() => onEdit(suggestion)}
              className="p-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(suggestion.id)}
              className="p-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const threadSection = threadOpen && (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
      <HRCommentThread
        entityType="suggestion"
        entityId={suggestion.id}
        canReply={suggestion.suggester_id === user?.id}
      />
    </div>
  );

  const titleClass = viewMode === 'list' ? 'font-semibold mb-2 line-clamp-1' : 'font-semibold mb-2 line-clamp-2';
  const descClass = viewMode === 'list'
    ? 'text-sm mt-3 line-clamp-2 mb-3'
    : 'text-sm mt-3 line-clamp-3 flex-1 mb-3';

  const cardBody = (
    <>
      <button type="button" onClick={() => onViewDetail(suggestion)} className="text-left w-full">
        <h3 className={titleClass} style={{ color: 'var(--text-primary)' }}>
          {suggestion.title}
        </h3>
      </button>
      <SuggestionBadges suggestion={suggestion} categoryColorMap={categoryColorMap} />
      <p className={descClass} style={{ color: 'var(--text-muted)' }}>
        {suggestion.description}
      </p>
      <div className="mb-3">{metaRow}</div>
      <div className="mb-3">{pollSection}</div>
      {actionsRow}
      {threadSection}
    </>
  );

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="rounded-xl border p-4 transition-shadow hover:shadow-md"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        {cardBody}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border p-5 transition-shadow hover:shadow-lg flex flex-col h-full"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {cardBody}
    </motion.div>
  );
};

export default SuggestionCard;
