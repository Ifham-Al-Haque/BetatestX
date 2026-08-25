/** Shared HR Panel constants for Complaints & Suggestions */

export const HR_INBOX_ROLES = ['admin', 'super_admin', 'hr_manager'];

export const isHROrAdmin = (role) => HR_INBOX_ROLES.includes(role);

export const COMPLAINT_CATEGORIES = [
  'Work Environment',
  'Harassment & Misconduct',
  'Discrimination',
  'Pay & Benefits',
  'Management Issues',
  'Safety Concerns',
  'Other',
];

/** Includes legacy category values still stored in the database */
export const CONCERN_CATEGORY_FILTER = [
  'Work Environment',
  'Harassment & Misconduct',
  'Harassment',
  'Misconduct',
  'Discrimination',
  'Safety Concerns',
  'Concerns',
];

export const COMPLAINT_DEPARTMENTS = [
  'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations',
  'Customer Service', 'Engineering', 'Design', 'Unassigned',
];

export const COMPLAINT_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
];

export const COMPLAINT_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export const SUGGESTION_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'implemented', label: 'Implemented', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export const SUGGESTION_PRIORITIES = COMPLAINT_PRIORITIES;

export const getComplaintStatusColor = (status) =>
  COMPLAINT_STATUSES.find((s) => s.value === status)?.color ||
  'bg-gray-100 text-gray-800 border-gray-200';

export const getComplaintPriorityColor = (priority) =>
  COMPLAINT_PRIORITIES.find((p) => p.value === priority)?.color ||
  'bg-gray-100 text-gray-800 border-gray-200';

export const getSuggestionStatusColor = (status) =>
  SUGGESTION_STATUSES.find((s) => s.value === status)?.color ||
  'bg-gray-100 text-gray-800 border-gray-200';

export const getSuggestionPriorityColor = (priority) =>
  SUGGESTION_PRIORITIES.find((p) => p.value === priority)?.color ||
  'bg-gray-100 text-gray-800 border-gray-200';

export const formatStatusLabel = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const getDaysOpen = (createdAt) => {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
};

export const getAgingLabel = (createdAt, status) => {
  if (status === 'resolved' || status === 'closed' || status === 'implemented') return null;
  const days = getDaysOpen(createdAt);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
};

export const getAgingColor = (createdAt, status) => {
  const days = getDaysOpen(createdAt);
  if (status === 'resolved' || status === 'closed' || status === 'implemented') return '';
  if (days >= 7) return 'text-red-600 bg-red-50 border-red-200';
  if (days >= 3) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

/** Resolve assignee label from joined user or cached name */
export const getAssigneeDisplayName = (record) =>
  record?.assignee?.full_name || record?.assigned_to_name || null;
