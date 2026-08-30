'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Poll, Post } from '@/types';

interface PollCardProps {
  poll: Poll;
  postId: string;
  explanation?: string;
  onVoted?: (updatedPost: Post) => void;
}

export function PollCard({ poll, postId, explanation, onVoted }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(() => {
    return !!(poll.votes && poll.votes.length > 0);
  });
  const [votedOptionId, setVotedOptionId] = useState<string | null>(() => {
    return poll.votes?.[0]?.pollOptionId || null;
  });
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalVotes = localPoll.options.reduce((s, o) => s + o.votes, 0);

  // Determine correct/wrong after voting
  const correctAnswer = localPoll.correctAnswer;
  const hasCorrectAnswer = correctAnswer !== null && correctAnswer !== undefined;

  // Find the option index that was voted
  const votedOptionIndex = hasVoted && votedOptionId
    ? localPoll.options.findIndex(o => o.id === votedOptionId)
    : -1;

  const isCorrect = hasVoted && hasCorrectAnswer && votedOptionIndex === correctAnswer;
  const isWrong   = hasVoted && hasCorrectAnswer && votedOptionIndex !== correctAnswer && votedOptionIndex !== -1;

  async function vote(optionIndex: number) {
    if (hasVoted || loading) return;
    setLoading(true);
    try {
      const { data } = await api.post<Post>(`/posts/${postId}/vote`, { optionIndex });
      if (data.poll) {
        setLocalPoll(data.poll);
        setVotedOptionId(data.poll.votes?.[0]?.pollOptionId || null);
      }
      setHasVoted(true);
      onVoted?.(data);

      // English toast feedback
      const didCorrect = hasCorrectAnswer && optionIndex === correctAnswer;
      toast(didCorrect ? 'Correct answer!' : 'Incorrect answer', {
        style: {
          background: didCorrect ? '#dcfce7' : '#fee2e2',
          color: didCorrect ? '#166534' : '#991b1b',
          fontWeight: 700,
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not vote');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '18px',
      marginTop: 12,
    }}>
      {/* Question */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: 15, lineHeight: 1.4 }}>
          {localPoll.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {localPoll.options.map((opt, idx) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isCorrectOpt = hasCorrectAnswer && idx === correctAnswer;
          const isMyVote = votedOptionId === opt.id;
          const isWrongVote = isMyVote && !isCorrectOpt;

          let borderColor = 'var(--color-border)';
          let barColor = 'var(--color-brand-tint)';
          if (hasVoted && isCorrectOpt)   { borderColor = '#22c55e'; barColor = '#dcfce7'; }
          if (hasVoted && isWrongVote)    { borderColor = 'var(--color-accent)'; barColor = 'var(--color-accent-tint)'; }

          const statusText = hasVoted
            ? (isCorrectOpt ? '✓ Correct' : (isMyVote ? '✗ Selected' : ''))
            : '';

          return (
            <div
              key={opt.id}
              onClick={() => !hasVoted && vote(idx)}
              style={{
                position: 'relative',
                border: `1.5px solid ${borderColor}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                cursor: hasVoted ? 'default' : (loading ? 'wait' : 'pointer'),
                background: 'white',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.1s',
              }}
              onMouseOver={(e) => {
                if (!hasVoted && !loading) e.currentTarget.style.borderColor = 'var(--color-brand)';
              }}
              onMouseOut={(e) => {
                if (!hasVoted) e.currentTarget.style.borderColor = borderColor;
              }}
            >
              {/* Progress bar fill */}
              {hasVoted && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: barColor,
                  transition: 'width 0.6s ease',
                }} />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: isMyVote ? 700 : 500,
                    color: 'var(--color-ink)',
                  }}>
                    {opt.label}
                  </span>
                  {statusText && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isCorrectOpt ? '#166534' : 'var(--color-accent)',
                      background: isCorrectOpt ? '#dcfce7' : '#fee2e2',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {statusText}
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', minWidth: 40, textAlign: 'right' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Result badge in English */}
      {hasVoted && hasCorrectAnswer && (
        <div style={{
          marginTop: 14,
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          background: isCorrect ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${isCorrect ? '#22c55e' : 'var(--color-accent)'}`,
          fontWeight: 700,
          fontSize: 14,
          color: isCorrect ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {isCorrect
            ? 'Correct Answer!'
            : <>Incorrect — The correct answer was: <strong>{localPoll.options[correctAnswer as number]?.label}</strong></>
          }
        </div>
      )}

      {/* Footer: vote count + explanation toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
        {explanation && !hasVoted && (
          <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontStyle: 'italic' }}>
            Answer to view explanation
          </span>
        )}
        {hasVoted && explanation && (
          <button
            onClick={() => setShowExplanation(v => !v)}
            style={{
              fontSize: 12, color: 'var(--color-brand)', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            {showExplanation ? 'Hide Explanation' : 'View Explanation'}
          </button>
        )}
      </div>

      {/* Explanation box */}
      {showExplanation && explanation && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          background: 'var(--color-gold-tint)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-gold)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6 }}>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
