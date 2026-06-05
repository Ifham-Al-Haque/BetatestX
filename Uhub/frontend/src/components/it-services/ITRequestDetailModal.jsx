import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, Mail, Building2, BadgeCheck, Tag, Flag,
  Clock, User, Settings, Wrench, MessageSquare, CalendarDays,
  UserCheck, CircleCheck,
} from 'lucide-react';
import Button from '../ui/button';
import Label from '../ui/label';
import Textarea from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../ui/card';
import { getCategoryIcon, parseSubcategoryFromDescription } from '../../constants/itServiceCategories';
import {
  getPriorityVisual,
  getStatusVisual,
  formatRequestDate,
  getRelativeTime,
  getRequesterInitials,
  getSLAStatus,
} from '../../constants/itRequestVisuals';
import { getAssigneeDisplayName } from '../../utils/itRequestEnrichment';

function MetaChip({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent || 'var(--gradient-primary)', color: '#fff' }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function TimelineStep({ icon: Icon, label, date, active, isLast }) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5"
          style={{ background: 'var(--border-primary)' }}
        />
      )}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-[var(--card-bg)]"
        style={{
          background: active ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
          color: active ? '#fff' : 'var(--text-muted)',
        }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="pt-0.5">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {date && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatRequestDate(date)}
            <span className="ml-1 opacity-75">({getRelativeTime(date)})</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * @param {'view' | 'manage'} mode — view for requesters; manage for Request Inbox
 */
export default function ITRequestDetailModal({
  request,
  onClose,
  mode = 'view',
  categories = [],
  priorities = [],
  itStaff = [],
  onSave,
  saving = false,
  prefersReducedMotion = false,
}) {
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState({
    status: request?.status || 'open',
    assigned_to: request?.assigned_to || '',
    resolution_notes: request?.resolution_notes || '',
  });

  useEffect(() => {
    if (!request) return;
    setDraft({
      status: request.status || 'open',
      assigned_to: request.assigned_to || '',
      resolution_notes: request.resolution_notes || '',
    });
  }, [request]);

  const category = useMemo(
    () => request?.category || categories.find((c) => c.id === request?.category_id),
    [request, categories]
  );
  const priority = useMemo(
    () => request?.priority || priorities.find((p) => p.id === request?.priority_id),
    [request, priorities]
  );

  const statusVisual = getStatusVisual(request?.status);
  const priorityVisual = getPriorityVisual(priority);
  const CategoryIcon = getCategoryIcon(category);
  const StatusIcon = statusVisual.icon;
  const PriorityIcon = priorityVisual.icon;
  const parsed = parseSubcategoryFromDescription(request?.description || '');
  const sla = getSLAStatus({ ...request, priority });

  const requesterName =
    request?.requester?.full_name || request?.requester_name || 'Unknown User';
  const requesterEmail = request?.requester?.email || request?.requester_email;
  const requesterDept = request?.requester?.department || request?.requester_department;
  const requesterRole = request?.requester?.role || request?.requester_role;

  const assignee = useMemo(() => {
    const name = getAssigneeDisplayName(request);
    if (name) return { full_name: name, ...request?.assignee };
    if (request?.assignee?.full_name) return request.assignee;
    if (draft.assigned_to) {
      return itStaff.find((s) => String(s.id) === String(draft.assigned_to));
    }
    return null;
  }, [request, draft.assigned_to, itStaff]);

  const handleCopy = async () => {
    const text = request?.request_number || String(request?.id || '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSave = () => {
    onSave?.({
      status: draft.status,
      assigned_to: draft.assigned_to || null,
      resolution_notes: draft.resolution_notes || null,
    });
  };

  if (!request) return null;

  const spring = prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 26, stiffness: 320 };

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          transition={spring}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Hero header */}
          <div
            className="relative shrink-0 overflow-hidden px-5 py-5 sm:px-6"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <div className="absolute inset-0 opacity-20" aria-hidden>
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-white/20 blur-xl" />
            </div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {request.request_number || `#${request.id}`}
                  </button>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: statusVisual.bgColor, color: statusVisual.color }}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusVisual.label}
                  </span>
                  {priority?.name && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: priorityVisual.bgColor, color: priorityVisual.color }}
                    >
                      <PriorityIcon className="h-3.5 w-3.5" />
                      {priority.name}
                    </span>
                  )}
                  {sla && request.status !== 'resolved' && request.status !== 'closed' && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background:
                          sla.status === 'overdue'
                            ? 'rgba(254,226,226,0.95)'
                            : sla.status === 'warning'
                              ? 'rgba(254,243,199,0.95)'
                              : 'rgba(209,250,229,0.95)',
                        color:
                          sla.status === 'overdue'
                            ? '#B91C1C'
                            : sla.status === 'warning'
                              ? '#B45309'
                              : '#047857',
                      }}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {sla.status === 'overdue'
                        ? `${sla.hours}h overdue`
                        : sla.status === 'warning'
                          ? `${sla.hours}h left`
                          : sla.label}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                  {request.title}
                </h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatRequestDate(request.created_at)}
                  </span>
                  <span>{getRelativeTime(request.created_at)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {/* Description */}
                <div
                  className="rounded-xl p-4 sm:p-5"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderLeft: '4px solid var(--accent-primary, #14b8a6)',
                    border: '1px solid var(--border-primary)',
                    borderLeftWidth: '4px',
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: 'var(--accent-primary, #14b8a6)' }} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      Description
                    </h3>
                  </div>
                  {parsed.subcategory && (
                    <span
                      className="mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    >
                      <Tag className="h-3 w-3" />
                      {parsed.subcategory}
                    </span>
                  )}
                  <p
                    className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {parsed.body || request.description || 'No description provided.'}
                  </p>
                </div>

                {/* Meta chips */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MetaChip
                    icon={CategoryIcon}
                    label="Category"
                    value={category?.name || request.category_name}
                    accent={category?.color || '#14b8a6'}
                  />
                  <MetaChip
                    icon={Flag}
                    label="Priority"
                    value={priority?.name || request.priority_name}
                    accent={priorityVisual.color}
                  />
                  {assignee && (
                    <MetaChip
                      icon={UserCheck}
                      label="Assigned to"
                      value={assignee.full_name}
                    />
                  )}
                  {request.estimated_completion_date && (
                    <MetaChip
                      icon={CalendarDays}
                      label="Est. completion"
                      value={formatRequestDate(request.estimated_completion_date)}
                    />
                  )}
                </div>

                {/* Resolution notes (read-only in view mode when present) */}
                {mode === 'view' && request.resolution_notes && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <CircleCheck className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Resolution notes
                      </h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {request.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Requester card */}
                <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <CardHeader className="pb-2">
                    <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <User className="h-4 w-4" />
                      Requester
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: 'var(--gradient-primary)' }}
                      >
                        {getRequesterInitials(requesterName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {requesterName}
                        </p>
                        {requesterEmail && (
                          <a
                            href={`mailto:${requesterEmail}`}
                            className="mt-0.5 inline-flex items-center gap-1 text-sm hover:underline"
                            style={{ color: 'var(--accent-primary, #14b8a6)' }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {requesterEmail}
                          </a>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {requesterDept && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              <Building2 className="h-3 w-3" />
                              {requesterDept}
                            </span>
                          )}
                          {requesterRole && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              <BadgeCheck className="h-3 w-3" />
                              {requesterRole.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                {mode === 'manage' ? (
                  <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <CardHeader className="pb-2">
                      <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <Settings className="h-4 w-4" />
                        Manage request
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Status
                        </Label>
                        <select
                          value={draft.status}
                          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                          className="w-full rounded-lg border px-3 py-2.5 text-sm"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {Object.entries(
                            {
                              open: 'Open',
                              assigned: 'Assigned',
                              in_progress: 'In Progress',
                              pending_approval: 'Pending Approval',
                              resolved: 'Resolved',
                              closed: 'Closed',
                              cancelled: 'Cancelled',
                            }
                          ).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Assign to
                        </Label>
                        <select
                          value={draft.assigned_to}
                          onChange={(e) => setDraft((d) => ({ ...d, assigned_to: e.target.value }))}
                          className="w-full rounded-lg border px-3 py-2.5 text-sm"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="">Unassigned</option>
                          {itStaff.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.full_name} ({staff.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Resolution notes
                        </Label>
                        <Textarea
                          value={draft.resolution_notes}
                          onChange={(e) => setDraft((d) => ({ ...d, resolution_notes: e.target.value }))}
                          placeholder="Document what was done to resolve this request…"
                          rows={4}
                          className="w-full resize-none rounded-lg border text-sm"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full border-0 text-white"
                          style={{ background: 'var(--gradient-primary)' }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                          onClick={() => {
                            /* future: create ticket flow */
                          }}
                        >
                          <Wrench className="mr-2 h-4 w-4" />
                          Create ticket
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <CardHeader className="pb-2">
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Status overview
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div
                        className="flex items-center gap-3 rounded-xl p-3"
                        style={{ background: statusVisual.bgColor }}
                      >
                        <StatusIcon className="h-5 w-5" style={{ color: statusVisual.color }} />
                        <div>
                          <p className="text-xs font-medium uppercase" style={{ color: statusVisual.color }}>
                            Current status
                          </p>
                          <p className="font-semibold" style={{ color: statusVisual.color }}>
                            {statusVisual.label}
                          </p>
                        </div>
                      </div>
                      {assignee && (
                        <div
                          className="flex items-center gap-3 rounded-xl p-3"
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
                        >
                          <UserCheck className="h-5 w-5" style={{ color: 'var(--accent-primary, #14b8a6)' }} />
                          <div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Assigned to</p>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{assignee.full_name}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <CardHeader className="pb-2">
                    <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <Clock className="h-4 w-4" />
                      Timeline
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <TimelineStep
                      icon={CalendarDays}
                      label="Request submitted"
                      date={request.created_at}
                      active
                      isLast={!request.assigned_at && !request.actual_completion_date && !request.updated_at}
                    />
                    {request.assigned_at && (
                      <TimelineStep
                        icon={UserCheck}
                        label="Assigned to IT"
                        date={request.assigned_at}
                        active
                        isLast={!request.actual_completion_date}
                      />
                    )}
                    {request.updated_at && request.updated_at !== request.created_at && (
                      <TimelineStep
                        icon={Settings}
                        label="Last updated"
                        date={request.updated_at}
                        active={false}
                        isLast={!request.actual_completion_date}
                      />
                    )}
                    {request.actual_completion_date && (
                      <TimelineStep
                        icon={CircleCheck}
                        label="Completed"
                        date={request.actual_completion_date}
                        active
                        isLast
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
