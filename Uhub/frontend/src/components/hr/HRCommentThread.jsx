import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hrPanelApi } from '../../services/hrPanelApi';
import { isHROrAdmin } from '../../config/hrPanelConfig';

/**
 * @param {'complaint'|'suggestion'} entityType
 * @param {string} entityId
 * @param {boolean} canReply - employee can post public replies
 */
const HRCommentThread = ({ entityType, entityId, canReply = false }) => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const isHR = isHROrAdmin(userProfile?.role);
  const canPost = isHR || canReply;

  const loadComments = useCallback(async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      const data =
        entityType === 'complaint'
          ? await hrPanelApi.complaintComments.getByComplaintId(entityId)
          : await hrPanelApi.suggestionComments.getBySuggestionId(entityId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !canPost) return;

    const internal = isHR ? isInternal : false;

    try {
      setSubmitting(true);
      const payload = {
        userId: user.id,
        userName: userProfile?.full_name || user.email,
        comment: text,
        isInternal: internal,
      };

      if (entityType === 'complaint') {
        await hrPanelApi.complaintComments.create({
          ...payload,
          complaintId: entityId,
        });
      } else {
        await hrPanelApi.suggestionComments.create({
          ...payload,
          suggestionId: entityId,
        });
      }

      setText('');
      setIsInternal(false);
      success(internal ? 'Internal note added' : 'Response sent');
      await loadComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isHR ? 'Response thread' : 'HR responses'}
        </h4>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({comments.length})</span>
      </div>

      {loading ? (
        <div className="py-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
          {isHR ? 'No responses yet. Add a public reply or internal note.' : 'No HR responses yet.'}
        </p>
      ) : (
        <ul className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg p-3 text-sm border"
              style={{
                background: 'var(--card-bg)',
                borderColor: c.is_internal ? 'var(--border-primary)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.user_name}</span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  {c.is_internal && (
                    <>
                      <Lock className="w-3 h-3" /> Internal ·
                    </>
                  )}
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {c.comment}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canPost && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isHR ? 'Write a response to the employee…' : 'Reply to HR…'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {isHR && (
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                />
                Internal note (hidden from employee)
              </label>
            )}
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isInternal ? 'Save note' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HRCommentThread;
