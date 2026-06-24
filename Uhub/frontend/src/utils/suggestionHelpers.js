import { SUGGESTION_PRIORITIES } from '../config/hrPanelConfig';

const CATEGORY_COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700',
  purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
  orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
  yellow: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
  red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
  teal: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700',
};

export const getCategoryColorClass = (color) =>
  CATEGORY_COLOR_CLASSES[color] || CATEGORY_COLOR_CLASSES.blue;

export const buildCategoryColorMap = (categories) =>
  Object.fromEntries(
    (categories || []).map((c) => [c.name, getCategoryColorClass(c.color)])
  );

export const formatPriorityLabel = (priority) =>
  SUGGESTION_PRIORITIES.find((p) => p.value === priority)?.label ||
  (priority || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const getNetVotes = (suggestion) =>
  (suggestion?.upvotes || 0) - (suggestion?.downvotes || 0);

export const getPollPercentages = (upvotes = 0, downvotes = 0) => {
  const up = upvotes || 0;
  const down = downvotes || 0;
  const totalVotes = up + down;
  if (totalVotes === 0) {
    return { upPct: 0, downPct: 0, totalVotes: 0 };
  }
  const upPct = Math.round((up / totalVotes) * 100);
  return { upPct, downPct: 100 - upPct, totalVotes };
};

/** Normalize legacy upvote/downvote strings to poll types */
export const normalizeVoteType = (voteType) => {
  if (voteType === 'up' || voteType === 'down') return voteType;
  if (voteType === 'upvote') return 'up';
  if (voteType === 'downvote') return 'down';
  return null;
};

export const canEditSuggestion = (suggestion, user, userProfile) =>
  suggestion?.suggester_id === user?.id ||
  ['admin', 'hr_manager', 'cs_manager'].includes(userProfile?.role);

export const PRIORITY_SORT_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export const formatSuggestionDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
