'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PollCard } from '@/components/poll/PollCard';
import type { Post, Comment, ReactionType } from '@/types';

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'LIKE',  emoji: '👍', label: 'Like',  color: '#6C4CFA' },
  { type: 'LOVE',  emoji: '❤️', label: 'Love',  color: '#FF6B4A' },
  { type: 'HAHA',  emoji: '😂', label: 'Haha',  color: '#FFC93C' },
  { type: 'WOW',   emoji: '😮', label: 'Wow',   color: '#22C55E' },
  { type: 'SAD',   emoji: '😢', label: 'Sad',   color: '#6E698A' },
];

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onUpdate?: (post: Post) => void;
}

/* ─── Share Modal ─── */
function ShareModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const postLink = typeof window !== 'undefined' ? `${window.location.origin}/feed#${post.id}` : '';

  async function handleShareToFeed() {
    toast.success('Shared to your feed! 🎉');
    onClose();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(postLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  }

  async function shareViaNavigator() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user.name} on StudyPartner`,
          text: post.text ?? '',
          url: postLink,
        });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #eee',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, color: '#1c1830' }}>Share</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f0f0f0', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#555',
            }}
          >✕</button>
        </div>

        {/* Share to feed section */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--color-brand-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, color: 'var(--color-brand)',
              }}>
                {user?.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
              <div style={{
                fontSize: 12, color: '#555', background: '#f0f0f0',
                padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                🌐 Public
              </div>
            </div>
          </div>
          <textarea
            placeholder="Say something about this…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 15, color: '#333', fontFamily: 'inherit', background: 'transparent',
            }}
          />
          <button
            onClick={handleShareToFeed}
            style={{
              width: '100%', marginTop: 10, padding: '10px',
              background: 'var(--color-brand)', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Share now
          </button>
        </div>

        {/* Send / Share options */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Share to
          </h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: '💬', label: 'Messenger', action: shareViaNavigator },
              { icon: '📱', label: 'WhatsApp', action: shareViaNavigator },
              { icon: '📖', label: 'Story', action: handleShareToFeed },
              { icon: '🔗', label: 'Copy Link', action: copyLink },
              { icon: '👥', label: 'Group', action: handleShareToFeed },
              { icon: '🔒', label: 'Private', action: handleShareToFeed },
            ].map(({ icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 10px', borderRadius: 8, transition: 'background 0.15s',
                  minWidth: 64,
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {label === 'Copy Link' && copied ? '✅' : icon}
                </div>
                <span style={{ fontSize: 11, color: '#333', fontWeight: 500, textAlign: 'center' }}>
                  {label === 'Copy Link' && copied ? 'Copied!' : label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Post preview */}
        <div style={{ padding: '12px 20px' }}>
          <div style={{
            border: '1px solid #e8e8e8', borderRadius: 8,
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            {post.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.user.avatar} alt={post.user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--color-brand-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: 'var(--color-brand)', flexShrink: 0,
              }}>
                {post.user.name[0]}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{post.user.name}</div>
              {post.text && (
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                  {post.text}
                </p>
              )}
            </div>
            {post.mediaUrl && post.mediaType === 'IMAGE' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post: initialPost, onDelete, onUpdate }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post>(initialPost);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionHoverTimer, setReactionHoverTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(!!post.user.isFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(!!post.user.isFollowing);
  }, [post.user.isFollowing]);

  async function handleToggleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return toast.error('Please log in first');
    if (followLoading) return;
    setFollowLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      const { data } = await api.post<{ following: boolean; followersCount: number }>(`/users/${post.user.id}/follow`);
      setIsFollowing(data.following);
      toast.success(data.following ? `Following @${post.user.handle}` : `Unfollowed @${post.user.handle}`);
    } catch {
      setIsFollowing(!nextState);
      toast.error('Could not update follow');
    } finally {
      setFollowLoading(false);
    }
  }

  const myReaction = post.reactions?.[0]?.type;
  const isOwner = user?.id === post.user.id;
  const myReactionData = myReaction ? REACTIONS.find(r => r.type === myReaction) : null;

  // Simple click = LIKE; long hover = show reaction picker
  async function handleLikeClick() {
    if (!showReactions) {
      // Quick like/unlike
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 400);
      try {
        const { data } = await api.post<Post>(`/posts/${post.id}/react`, { type: myReaction ? myReaction : 'LIKE' });
        setPost(data);
        onUpdate?.(data);
      } catch { toast.error('Could not react'); }
    }
  }

  async function react(type: ReactionType) {
    setShowReactions(false);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    try {
      const { data } = await api.post<Post>(`/posts/${post.id}/react`, { type });
      setPost(data);
      onUpdate?.(data);
    } catch { toast.error('Could not react'); }
  }

  function handleLikeMouseEnter() {
    const t = setTimeout(() => setShowReactions(true), 500);
    setReactionHoverTimer(t);
  }

  function handleLikeMouseLeave() {
    if (reactionHoverTimer) clearTimeout(reactionHoverTimer);
    setTimeout(() => setShowReactions(false), 300);
  }

  async function loadComments() {
    if (commentsLoaded) return;
    try {
      const { data } = await api.get<Comment[]>(`/posts/${post.id}/comments`);
      setComments(data);
      setCommentsLoaded(true);
    } catch { toast.error('Could not load comments'); }
  }

function containsLink(text?: string): boolean {
  if (!text) return false;
  const linkRegex = /(https?:\/\/|www\.|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  return linkRegex.test(text);
}

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (containsLink(commentText)) {
      return toast.error('Links and URLs are not allowed in comments');
    }
    try {
      const { data } = await api.post<Comment>(`/posts/${post.id}/comments`, { text: commentText.trim() });
      setComments(prev => [...prev, data]);
      setCommentText('');
      setPost(p => ({ ...p, _count: { ...p._count, comments: p._count.comments + 1 } }));
    } catch { toast.error('Could not post comment'); }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
      toast.success('Post deleted');
    } catch { toast.error('Could not delete'); }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/posts/${post.id}/report`, { reason: reportReason });
      toast.success('Report submitted');
      setShowReport(false);
      setReportReason('');
    } catch { toast.error('Could not report'); }
  }

  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden' }} id={post.id}>
      {/* Featured banner */}
      {post.featured && (
        <div style={{
          background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent))',
          color: 'white', fontSize: 12, fontWeight: 700,
          padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⭐ Featured Post
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => router.push(`/profile?handle=${post.user.handle}`)}
          >
            {post.user.avatar ? (
              <Image src={post.user.avatar} alt={post.user.name} width={40} height={40} className="avatar" unoptimized />
            ) : (
              <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)' }}>
                {post.user.name[0]}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>{post.user.name}</span>
                {post.user.isAdmin && <span className="badge badge-brand" style={{ fontSize: 10 }}>⚡ Admin</span>}
                {post.featured && <span className="badge badge-gold" style={{ fontSize: 10 }}>Featured</span>}
                {post.type === 'POLL' && <span className="badge badge-accent" style={{ fontSize: 10 }}>📊 Poll</span>}
                {!isOwner && (
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    style={{
                      border: 'none',
                      background: isFollowing ? 'var(--color-bg)' : 'var(--color-brand-tint)',
                      color: isFollowing ? 'var(--color-ink-soft)' : 'var(--color-brand)',
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                      transition: 'all 0.15s',
                    }}
                    title={isFollowing ? 'Click to unfollow' : 'Follow this user'}
                  >
                    {isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                @{post.user.handle} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                <span style={{ marginLeft: 4 }}>· 🌐</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {!isOwner && (
              <button onClick={() => setShowReport(v => !v)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>
                🚩
              </button>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--color-accent)' }}>
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Post text */}
        {post.type !== 'POLL' && (
          <>
            {post.text && (
              <p style={{ fontSize: 15, color: 'var(--color-ink)', lineHeight: 1.6, marginBottom: post.explanation ? 10 : (post.mediaUrl ? 8 : 0) }}>
                {post.text}
              </p>
            )}
            {post.explanation && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: post.text ? 6 : 0, marginBottom: post.mediaUrl ? 8 : 0 }}>
                <button
                  onClick={() => setShowExplanation(v => !v)}
                  style={{
                    fontSize: 12, color: 'var(--color-brand)', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0',
                  }}
                >
                  💡 {showExplanation ? 'Hide explanation' : 'Explanation'}
                </button>
              </div>
            )}
            {showExplanation && post.explanation && (
              <div style={{
                marginBottom: 10, padding: '10px 14px',
                background: 'var(--color-gold-tint)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--color-gold)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6 }}>💡 {post.explanation}</p>
              </div>
            )}
          </>
        )}

        {post.type === 'POLL' && post.text && (
          <p style={{ fontSize: 15, color: 'var(--color-ink)', lineHeight: 1.6, marginBottom: 4 }}>
            {post.text}
          </p>
        )}
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div style={{ position: 'relative', width: '100%', background: 'var(--color-bg)' }}>
          {post.mediaType === 'VIDEO' ? (
            <video src={post.mediaUrl} controls style={{ width: '100%', maxHeight: 400, display: 'block' }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt="Post media"
              style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div style={{ padding: '0 20px 4px' }}>
          <PollCard
            poll={post.poll}
            postId={post.id}
            explanation={post.explanation}
            onVoted={(updated) => { setPost(updated); onUpdate?.(updated); }}
          />
        </div>
      )}

      {/* Report form */}
      {showReport && (
        <div style={{ padding: '0 20px 12px' }}>
          <form onSubmit={handleReport} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              className="input"
              placeholder="Reason for report…"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
              minLength={3}
              style={{ padding: '8px 12px', fontSize: 13 }}
            />
            <button type="submit" className="btn-brand" style={{ padding: '8px 14px', fontSize: 13 }}>
              Report
            </button>
          </form>
        </div>
      )}

      {/* Reaction summary row */}
      {post._count.reactions > 0 && (
        <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex' }}>
              {REACTIONS.slice(0, 3).map(r => (
                <span
                  key={r.type}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: '50%',
                    background: r.color + '22', fontSize: 12,
                    marginLeft: -3, border: '1.5px solid white',
                  }}
                >{r.emoji}</span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-ink-soft)', cursor: 'default' }}>
              {post._count.reactions} reaction{post._count.reactions !== 1 ? 's' : ''}
            </span>
          </div>
          {post._count.comments > 0 && (
            <span
              style={{ fontSize: 13, color: 'var(--color-ink-soft)', cursor: 'pointer' }}
              onClick={() => { setShowComments(v => !v); if (!commentsLoaded) loadComments(); }}
            >
              {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ─── ACTION BAR ─── */}
      <div style={{
        display: 'flex',
        padding: '4px 8px 8px',
        borderTop: '1px solid var(--color-border)',
        marginTop: 8,
        gap: 0,
      }}>
        {/* Like */}
        <div
          style={{ flex: 1, position: 'relative', display: 'flex' }}
          onMouseEnter={handleLikeMouseEnter}
          onMouseLeave={handleLikeMouseLeave}
        >
          <button
            className="btn-ghost"
            style={{
              flex: 1, fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: myReaction ? (myReactionData?.color ?? 'var(--color-brand)') : 'var(--color-ink-soft)',
              fontWeight: myReaction ? 700 : 500,
              padding: '9px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s',
            }}
            onClick={handleLikeClick}
          >
            <span style={{
              fontSize: 17,
              display: 'inline-block',
              transform: likeAnimating ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(.36,.07,.19,.97)',
            }}>
              {myReactionData?.emoji || '👍'}
            </span>
            <span style={{ fontSize: 13 }}>
              {myReactionData ? myReactionData.label : 'Like'}
            </span>
          </button>

          {/* Hover reaction picker */}
          {showReactions && (
            <div
              style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
                background: 'white', border: '1px solid var(--color-border)',
                borderRadius: 30, padding: '8px 12px',
                display: 'flex', gap: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50,
                animation: 'fadeInUp 0.15s ease',
              }}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={(e) => { e.stopPropagation(); react(r.type); }}
                  style={{
                    fontSize: 26, border: 'none', background: 'none', cursor: 'pointer',
                    transition: 'transform 0.1s', padding: 3, borderRadius: '50%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget.style.transform = 'scale(1.4) translateY(-4px)');
                    const label = e.currentTarget.querySelector('.reaction-label') as HTMLElement;
                    if (label) label.style.opacity = '1';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget.style.transform = 'scale(1) translateY(0)');
                    const label = e.currentTarget.querySelector('.reaction-label') as HTMLElement;
                    if (label) label.style.opacity = '0';
                  }}
                  title={r.label}
                >
                  {r.emoji}
                  <span className="reaction-label" style={{
                    fontSize: 9, fontWeight: 700, color: '#333',
                    opacity: 0, transition: 'opacity 0.1s', marginTop: 1,
                    pointerEvents: 'none', whiteSpace: 'nowrap',
                  }}>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--color-border)', margin: '6px 0' }} />

        {/* Comment */}
        <button
          className="btn-ghost"
          style={{
            flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: showComments ? 'var(--color-brand)' : 'var(--color-ink-soft)',
            fontWeight: showComments ? 700 : 500,
            padding: '9px 8px', transition: 'all 0.15s',
          }}
          onClick={() => { setShowComments(v => !v); if (!commentsLoaded) loadComments(); }}
        >
          <span style={{ fontSize: 17 }}>💬</span>
          <span>Comment</span>
        </button>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--color-border)', margin: '6px 0' }} />

        {/* Share */}
        <button
          className="btn-ghost"
          style={{
            flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--color-ink-soft)', padding: '9px 8px', transition: 'all 0.15s',
          }}
          onClick={() => setShowShare(true)}
        >
          <span style={{ fontSize: 17 }}>↗️</span>
          <span>Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--color-border)', marginTop: -1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {comments.length === 0 && commentsLoaded && (
              <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', textAlign: 'center', padding: '8px 0' }}>
                No comments yet. Be the first!
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                {c.user.avatar ? (
                  <Image src={c.user.avatar} alt={c.user.name} width={32} height={32} className="avatar" unoptimized />
                ) : (
                  <div className="avatar" style={{ width: 32, height: 32, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-brand)', flexShrink: 0 }}>
                    {c.user.name[0]}
                  </div>
                )}
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', flex: 1 }}>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2, cursor: 'pointer' }}
                    onClick={() => router.push(`/profile?handle=${c.user.handle}`)}
                  >
                    {c.user.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>{c.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 4 }}>
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--color-brand)', flexShrink: 0 }}>
                {user?.name?.[0] ?? '?'}
              </div>
            )}
            <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, flex: 1 }}>
              <input
                className="input"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ padding: '8px 14px', fontSize: 13, borderRadius: 20, flex: 1 }}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="btn-brand"
                style={{ padding: '8px 16px', fontSize: 13, borderRadius: 20, opacity: commentText.trim() ? 1 : 0.5 }}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </article>
  );
}
