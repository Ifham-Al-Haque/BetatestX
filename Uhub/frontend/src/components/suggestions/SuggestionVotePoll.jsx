import React from 'react';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { getPollPercentages } from '../../utils/suggestionHelpers';

const VoteOption = ({ type, count, pct, active, disabled, onClick }) => {
  const isUp = type === 'up';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={active ? 'Click again to remove your vote' : `Vote ${isUp ? 'support' : 'against'}`}
      className={`flex-1 min-w-0 rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-50 ${
        active
          ? isUp
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/25 ring-2 ring-emerald-500/30'
            : 'border-red-500 bg-red-50 dark:bg-red-900/25 ring-2 ring-red-500/30'
          : 'border-transparent hover:opacity-90'
      }`}
      style={!active ? { background: 'var(--bg-tertiary)' } : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {isUp ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
          {isUp ? 'Support' : 'Against'}
        </span>
        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          {pct}%
        </span>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {count} vote{count !== 1 ? 's' : ''}
      </span>
    </button>
  );
};

const SuggestionVotePoll = ({
  upvotes = 0,
  downvotes = 0,
  userVote = null,
  onVote,
  disabled = false,
  compact = false,
  readOnly = false,
}) => {
  const { upPct, downPct, totalVotes } = getPollPercentages(upvotes, downvotes);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {readOnly ? 'Poll results' : 'Community poll'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Users className="w-3 h-3" />
          {totalVotes} participant{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-tertiary)' }}>
        {totalVotes > 0 ? (
          <>
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${upPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
              style={{ width: `${downPct}%` }}
            />
          </>
        ) : (
          <div className="h-full w-full opacity-40" style={{ background: 'var(--border-primary)' }} />
        )}
      </div>

      {readOnly ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-tertiary)' }}>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <ThumbsUp className="w-3.5 h-3.5" />
              Support
            </span>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {upvotes} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({upPct}%)</span>
            </p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-tertiary)' }}>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
              <ThumbsDown className="w-3.5 h-3.5" />
              Against
            </span>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {downvotes} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({downPct}%)</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <VoteOption
              type="up"
              count={upvotes}
              pct={upPct}
              active={userVote === 'up'}
              disabled={disabled}
              onClick={() => onVote('up')}
            />
            <VoteOption
              type="down"
              count={downvotes}
              pct={downPct}
              active={userVote === 'down'}
              disabled={disabled}
              onClick={() => onVote('down')}
            />
          </div>

          {userVote && (
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              You voted {userVote === 'up' ? 'Support' : 'Against'} — click again to remove
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default SuggestionVotePoll;
