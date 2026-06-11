import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Settings, Calendar, Tag, UserCheck, Timer, Inbox, CheckCircle,
} from 'lucide-react';
import Button from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getCategoryIcon, stripSubcategoryPrefix } from '../../constants/itServiceCategories';
import {
  getStatusVisual,
  getPriorityVisual,
  formatRequestDate,
  getRelativeTime,
  getRequesterInitials,
  getSLAStatus,
} from '../../constants/itRequestVisuals';
import {
  getAssigneeDisplayName,
  getCategoryDisplayName,
  getPriorityDisplayName,
} from '../../utils/itRequestEnrichment';
import { safeMotion } from '../../utils/motion';

function AssigneeBadge({ request }) {
  const name = getAssigneeDisplayName(request);
  const isAssigned = Boolean(request.assigned_to && name);

  if (!request.assigned_to) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px dashed var(--border-primary)' }}
      >
        <Inbox className="h-3.5 w-3.5" />
        Unassigned
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: 'rgba(20, 184, 166, 0.12)',
        color: '#0f766e',
        border: '1px solid rgba(20, 184, 166, 0.35)',
      }}
    >
      <UserCheck className="h-3.5 w-3.5" />
      {isAssigned ? name : 'Loading assignee…'}
      {request.assigned_at && (
        <span className="font-normal opacity-80">· {getRelativeTime(request.assigned_at)}</span>
      )}
    </span>
  );
}

export default function ITRequestTicketCard({
  request,
  index = 0,
  categories = [],
  priorities = [],
  onOpen,
  onManage,
  onCloseTicket,
  showManage = true,
  prefersReducedMotion = false,
}) {
  const category =
    request.category || categories.find((c) => String(c.id) === String(request.category_id));
  const priority =
    request.priority || priorities.find((p) => String(p.id) === String(request.priority_id));

  const statusVisual = getStatusVisual(request.status);
  const priorityVisual = getPriorityVisual(priority);
  const CategoryIcon = getCategoryIcon(category);
  const StatusIcon = statusVisual.icon;
  const PriorityIcon = priorityVisual.icon;
  const sla = getSLAStatus({ ...request, priority });

  const requesterName =
    request.requester?.full_name || request.requester_name || 'Unknown';
  const requesterEmail = request.requester?.email || request.requester_email;
  const requesterDept = request.requester?.department || request.requester_department;
  const categoryName = getCategoryDisplayName(request, categories);
  const priorityName = getPriorityDisplayName(request, priorities);

  const accentColor = category?.color || priorityVisual.color || '#14b8a6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReducedMotion ? 0 : Math.min(index * 0.04, 0.3), duration: 0.3 }}
      whileHover={safeMotion(prefersReducedMotion, { y: -3 }, {})}
      className="group"
    >
      <Card
        className="cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          borderLeftWidth: '4px',
          borderLeftColor: accentColor,
        }}
        onClick={() => onOpen?.(request)}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accentColor}18`, color: accentColor }}
                >
                  <CategoryIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className="text-lg font-semibold leading-snug group-hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {request.title}
                    </h3>
                    {request.request_number && (
                      <span
                        className="rounded-md px-2 py-0.5 font-mono text-xs"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-primary)',
                        }}
                      >
                        {request.request_number}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: statusVisual.bgColor, color: statusVisual.color }}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusVisual.label}
                    </span>
                    {priorityName && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: priorityVisual.bgColor, color: priorityVisual.color }}
                      >
                        <PriorityIcon className="h-3.5 w-3.5" />
                        {priorityName}
                      </span>
                    )}
                    {sla && !['resolved', 'closed', 'cancelled'].includes(request.status) && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sla.status === 'overdue'
                            ? 'bg-red-500 text-white'
                            : sla.status === 'warning'
                              ? 'bg-amber-500 text-white'
                              : sla.status === 'paused'
                                ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <Timer className="h-3.5 w-3.5" />
                        {sla.status === 'overdue'
                          ? `${sla.hours}h overdue`
                          : sla.status === 'paused'
                            ? 'SLA paused'
                            : `${sla.hours}h left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {getRequesterInitials(requesterName)}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {requesterName}
                </span>
                {requesterEmail && (
                  <span
                    className="rounded-md px-2 py-0.5 text-xs"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                  >
                    {requesterEmail}
                  </span>
                )}
                {requesterDept && (
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                    style={{ background: accentColor }}
                  >
                    {requesterDept}
                  </span>
                )}
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {stripSubcategoryPrefix(request.description) || 'No description'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {categoryName && (
                  <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Tag className="h-3.5 w-3.5" />
                    {categoryName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRequestDate(request.created_at)}
                </span>
                <AssigneeBadge request={request} />
              </div>

              {request.resolution_notes && (
                <div
                  className="rounded-lg border-l-4 px-3 py-2 text-sm"
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderLeftColor: '#10b981',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Resolution: </span>
                  {request.resolution_notes}
                </div>
              )}
            </div>

            <div
              className="flex shrink-0 flex-row gap-2 opacity-100 sm:opacity-90 lg:flex-col lg:opacity-80 lg:group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpen?.(request)}
                className="flex flex-1 items-center justify-center gap-2 lg:flex-none"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              {showManage && onManage && (
                <Button
                  size="sm"
                  onClick={() => onManage(request)}
                  className="flex flex-1 items-center justify-center gap-2 border-0 text-white lg:flex-none"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </Button>
              )}
              {onCloseTicket && (
                <Button
                  size="sm"
                  onClick={() => onCloseTicket(request)}
                  className="flex flex-1 items-center justify-center gap-2 border-0 text-white lg:flex-none"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
