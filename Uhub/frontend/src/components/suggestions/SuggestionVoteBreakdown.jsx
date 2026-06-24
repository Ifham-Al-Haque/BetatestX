import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Users, ChevronDown, Mail, Building2, Clock, Loader2 } from 'lucide-react';

const VoteList = ({ title, icon: Icon, accentClass, items, emptyLabel }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <span className={`inline-flex items-center gap-2 text-sm font-semibold ${accentClass}`}>
          <Icon className="w-4 h-4" />
          {title}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}
          >
            {items.length}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{emptyLabel}</p>
          ) : (
            items.map((vote) => (
              <div key={`${vote.voter_id}-${vote.voted_at}`} className="px-4 py-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {vote.voter_name}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {vote.voter_department && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {vote.voter_department}
                    </span>
                  )}
                  {vote.voter_email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {vote.voter_email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(vote.voted_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const SuggestionVoteBreakdown = ({ support = [], against = [], loading = false, error = null }) => {
  const total = support.length + against.length;

  if (loading) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading vote breakdown...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-200 border-amber-200 dark:border-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Vote breakdown (HR)
        </span>
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Users className="w-3 h-3" />
          {total} voter{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <VoteList
          title="Support"
          icon={ThumbsUp}
          accentClass="text-emerald-600"
          items={support}
          emptyLabel="No support votes yet"
        />
        <VoteList
          title="Against"
          icon={ThumbsDown}
          accentClass="text-red-500"
          items={against}
          emptyLabel="No against votes yet"
        />
      </div>
    </div>
  );
};

export default SuggestionVoteBreakdown;
