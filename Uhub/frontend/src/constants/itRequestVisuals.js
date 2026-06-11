import {
  FileText, Clock, User, AlertCircle, CheckCircle, XCircle, Archive,
  AlertTriangle, Flag, Timer, Calendar,
} from 'lucide-react';

export const IT_PRIORITY_CONFIG = {
  Critical: { color: '#DC2626', bgColor: '#FEE2E2', icon: AlertTriangle },
  High: { color: '#EA580C', bgColor: '#FED7AA', icon: Flag },
  Medium: { color: '#D97706', bgColor: '#FEF3C7', icon: Clock },
  Low: { color: '#65A30D', bgColor: '#DCFCE7', icon: Timer },
  Planning: { color: '#6B7280', bgColor: '#F3F4F6', icon: Calendar },
};

export const IT_STATUS_CONFIG = {
  open: { color: '#3B82F6', bgColor: '#DBEAFE', icon: FileText, label: 'Open' },
  assigned: { color: '#0EA5E9', bgColor: '#E0F2FE', icon: User, label: 'Assigned' },
  in_progress: { color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock, label: 'In Progress' },
  pending_approval: { color: '#8B5CF6', bgColor: '#EDE9FE', icon: AlertCircle, label: 'Pending Approval' },
  pending_user: { color: '#8B5CF6', bgColor: '#EDE9FE', icon: User, label: 'Pending User' },
  resolved: { color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle, label: 'Resolved' },
  closed: { color: '#6B7280', bgColor: '#F3F4F6', icon: Archive, label: 'Closed' },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', icon: XCircle, label: 'Cancelled' },
};

export function getPriorityVisual(priority) {
  const name = priority?.name || priority?.priority_name;
  return IT_PRIORITY_CONFIG[name] || IT_PRIORITY_CONFIG.Medium;
}

export function getStatusVisual(status) {
  return IT_STATUS_CONFIG[status] || IT_STATUS_CONFIG.open;
}

export function formatRequestDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRelativeTime(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getRequesterInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Priorities with a fixed (non-editable) SLA — policy driven
export const FIXED_SLA_PRIORITIES = ['Critical', 'High'];

export function isSlaFixedForPriority(priority) {
  const name = priority?.name || priority?.priority_name;
  return FIXED_SLA_PRIORITIES.includes(name);
}

export function getSLAStatus(request) {
  if (!request) return null;
  const priority = request.priority || {};
  const slaHours = priority.sla_hours || request.sla_hours || request.priority_sla_hours || 72;

  // SLA clock paused while waiting on the requester (pending_user)
  if (request.sla_paused_at) {
    return { status: 'paused', hours: 0, label: 'SLA paused', dueAt: request.sla_due_at || null };
  }

  // Preferred: real due date stored on the ticket
  if (request.sla_due_at) {
    const msLeft = new Date(request.sla_due_at).getTime() - Date.now();
    const hours = Math.abs(Math.floor(msLeft / (1000 * 60 * 60)));
    if (msLeft < 0) {
      return { status: 'overdue', hours, label: 'Overdue', dueAt: request.sla_due_at };
    }
    if (msLeft < slaHours * 0.2 * 60 * 60 * 1000) {
      return { status: 'warning', hours, label: 'Due soon', dueAt: request.sla_due_at };
    }
    return { status: 'ok', hours, label: 'On track', dueAt: request.sla_due_at };
  }

  // Fallback: estimate from created_at + priority SLA hours
  if (!request.created_at) return null;
  const hoursElapsed = (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > slaHours) {
    return { status: 'overdue', hours: Math.floor(hoursElapsed - slaHours), label: 'Overdue', dueAt: null };
  }
  if (hoursElapsed > slaHours * 0.8) {
    return { status: 'warning', hours: Math.floor(slaHours - hoursElapsed), label: 'Due soon', dueAt: null };
  }
  return { status: 'ok', hours: Math.floor(slaHours - hoursElapsed), label: 'On track', dueAt: null };
}
