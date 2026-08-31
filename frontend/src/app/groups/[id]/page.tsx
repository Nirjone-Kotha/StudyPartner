'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PostCard } from '@/components/feed/PostCard';
import api from '@/lib/api';
import type { GroupItem, GroupMemberItem, Post, FriendUser } from '@/types';

function containsLink(text?: string): boolean {
  if (!text) return false;
  const linkRegex = /(https?:\/\/|www\.|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  return linkRegex.test(text);
}

/* ─── Invite Friends Modal ─── */
function InviteFriendsModal({
  groupId,
  groupName,
  onClose,
}: {
  groupId: string;
  groupName: string;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    api.get<FriendUser[]>('/friends/list')
      .then(({ data }) => setFriends(data || []))
      .catch(() => toast.error('Could not load friends'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (friendId: string) => {
    try {
      await api.post(`/groups/${groupId}/invite`, { userIds: [friendId] });
      setInvitedMap(prev => ({ ...prev, [friendId]: true }));
      toast.success('Invitation sent');
    } catch {
      toast.error('Could not send invite');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(28,24,48,0.60)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 0, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)' }}>
            Invite Friends ({groupName})
          </h2>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', padding: 4 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 13 }}>Loading friends…</div>
          ) : friends.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>No friends found</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 4 }}>Add friends first to invite them.</div>
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 8px', borderBottom: '1px solid var(--color-border)', gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  {f.avatar ? (
                    <Image src={f.avatar} alt={f.name} width={38} height={38} className="avatar" unoptimized />
                  ) : (
                    <div className="avatar" style={{ width: 38, height: 38, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)' }}>
                      {f.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>@{f.handle}</div>
                  </div>
                </div>

                <button
                  className={invitedMap[f.id] ? 'btn-ghost' : 'btn-brand'}
                  disabled={invitedMap[f.id]}
                  onClick={() => handleInvite(f.id)}
                  style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                >
                  {invitedMap[f.id] ? 'Invited' : 'Invite'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Group Post Composer ─── */
function GroupComposer({
  groupId,
  onPostCreated,
}: {
  groupId: string;
  onPostCreated: (post: Post) => void;
}) {
  const [tab, setTab] = useState<'text' | 'poll'>('text');
  const [text, setText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Photo must be less than 5MB');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setMediaUrl(b64);
      setMediaPreview(b64);
    };
    reader.readAsDataURL(file);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'text' && !text.trim() && !mediaUrl.trim()) {
      return toast.error('Please write something or attach a photo');
    }
    if (tab === 'poll') {
      if (!question.trim()) return toast.error('Please write a poll question');
      const validOpts = options.filter(o => o.trim());
      if (validOpts.length < 2) return toast.error('At least 2 options required');
    }

    if (containsLink(text) || containsLink(explanation) || containsLink(question) || options.some(containsLink)) {
      return toast.error('Links and URLs are not allowed');
    }

    setLoading(true);
    try {
      if (tab === 'poll') {
        const validOpts = options.filter(o => o.trim());
        const { data } = await api.post<Post>(`/groups/${groupId}/posts`, {
          explanation: explanation.trim() || undefined,
          poll: {
            question: question.trim(),
            options: validOpts,
            correctAnswer,
          },
        });
        toast.success('Poll created successfully');
        onPostCreated(data);
      } else {
        const { data } = await api.post<Post>(`/groups/${groupId}/posts`, {
          text: text.trim() || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType: mediaUrl.trim() ? 'IMAGE' : undefined,
          explanation: explanation.trim() || undefined,
        });
        toast.success('Post published successfully');
        onPostCreated(data);
      }

      setText('');
      setMediaUrl('');
      setMediaPreview(null);
      setExplanation('');
      setQuestion('');
      setOptions(['', '', '', '']);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setTab('text')}
          style={{
            padding: '6px 14px', border: 'none', borderRadius: 20,
            cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: tab === 'text' ? 'var(--color-brand-tint)' : 'transparent',
            color: tab === 'text' ? 'var(--color-brand)' : 'var(--color-ink-soft)',
          }}
        >
          Write Post
        </button>
        <button
          type="button"
          onClick={() => setTab('poll')}
          style={{
            padding: '6px 14px', border: 'none', borderRadius: 20,
            cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: tab === 'poll' ? 'var(--color-brand-tint)' : 'transparent',
            color: tab === 'poll' ? 'var(--color-brand)' : 'var(--color-ink-soft)',
          }}
        >
          Create Poll
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'text' ? (
          <>
            <textarea
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share notes, questions, or updates with this group…"
              rows={3}
              style={{ resize: 'none', lineHeight: 1.5 }}
            />

            {mediaPreview && (
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaPreview} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8 }} />
                <button
                  type="button"
                  onClick={() => { setMediaUrl(''); setMediaPreview(null); }}
                  style={{
                    position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)',
                    color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22,
                    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: 13, padding: '6px 12px' }}
              >
                Attach Photo
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              className="input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Write your MCQ question…"
              style={{ fontWeight: 600 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: correctAnswer === i ? '1.5px solid var(--color-brand)' : '1px solid var(--color-border)' }}>
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === i}
                    onChange={() => setCorrectAnswer(i)}
                    title="Mark as correct answer"
                  />
                  <input
                    className="input"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    style={{ border: 'none', background: 'transparent', padding: 4, fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>
              Click the radio button next to an option to mark it as the correct answer.
            </p>
          </>
        )}

        <input
          className="input"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explanation / Solution note (optional)"
          style={{ fontSize: 13 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button type="submit" className="btn-brand" disabled={loading} style={{ padding: '8px 22px', fontSize: 13 }}>
            {loading ? 'Posting…' : 'Post to Group'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  const router = useRouter();
  const { user, hydrate } = useAuth();

  const [group, setGroup] = useState<GroupItem | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupRes, postsRes, membersRes] = await Promise.all([
        api.get<GroupItem>(`/groups/${groupId}`),
        api.get<Post[]>(`/groups/${groupId}/posts`).catch(() => ({ data: [] })),
        api.get<GroupMemberItem[]>(`/groups/${groupId}/members`).catch(() => ({ data: [] })),
      ]);
      setGroup(groupRes.data);
      setPosts(postsRes.data);
      setMembers(membersRes.data);
    } catch {
      toast.error('Could not load group');
      router.push('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId]);

  const handleJoin = async () => {
    try {
      const { data } = await api.post<GroupItem>(`/groups/${groupId}/join`);
      setGroup(data);
      toast.success('Joined group');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      toast.success('Left group');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not leave');
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Group link copied');
    }
  };

  if (loading || !group) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Topbar />
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--color-ink-faint)' }}>
          Loading group…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />

      <div className="feed-layout" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div className="left-sidebar"><LeftNav /></div>

        <main style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{
              height: 180,
              background: group.coverImage
                ? `url(${group.coverImage}) center/cover no-repeat`
                : 'linear-gradient(135deg, #1C1830 0%, #3B2D60 50%, var(--color-brand) 100%)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', bottom: 12, left: 24,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  background: 'rgba(0,0,0,0.65)', color: 'white',
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  backdropFilter: 'blur(4px)',
                }}>
                  {group.category}
                </span>
                <span style={{
                  background: 'rgba(0,0,0,0.65)', color: 'white',
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  backdropFilter: 'blur(4px)',
                }}>
                  {group.isPrivate ? 'Private Group' : 'Public Group'}
                </span>
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 4 }}>
                  {group.name}
                </h1>
                <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span><strong>{group.membersCount}</strong> members</span>
                  <span><strong>{group.postsCount}</strong> posts</span>
                  <span>Created by <strong style={{ color: 'var(--color-brand)', cursor: 'pointer' }} onClick={() => router.push(`/profile?handle=${group.creator.handle}`)}>@{group.creator.handle}</strong></span>
                </div>
                {group.description && (
                  <p style={{ fontSize: 14, color: 'var(--color-ink)', marginTop: 10, lineHeight: 1.5, maxWidth: 650 }}>
                    {group.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className="btn-ghost"
                  onClick={handleShare}
                  style={{ fontSize: 13 }}
                >
                  Share
                </button>

                {group.isMember ? (
                  <>
                    <button
                      className="btn-ghost"
                      onClick={() => setShowInviteModal(true)}
                      style={{ fontSize: 13 }}
                    >
                      Invite Friends
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={handleLeave}
                      style={{ fontSize: 13, color: '#dc2626' }}
                    >
                      Leave Group
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-brand"
                    onClick={handleJoin}
                    style={{ fontSize: 14, padding: '10px 24px' }}
                  >
                    Join Group
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', padding: '0 24px' }}>
              <button
                onClick={() => setActiveTab('feed')}
                style={{
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  color: activeTab === 'feed' ? 'var(--color-brand)' : 'var(--color-ink-soft)',
                  borderBottom: activeTab === 'feed' ? '3px solid var(--color-brand)' : '3px solid transparent',
                }}
              >
                Discussions & Feed
              </button>
              <button
                onClick={() => setActiveTab('members')}
                style={{
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  color: activeTab === 'members' ? 'var(--color-brand)' : 'var(--color-ink-soft)',
                  borderBottom: activeTab === 'members' ? '3px solid var(--color-brand)' : '3px solid transparent',
                }}
              >
                Members ({members.length})
              </button>
            </div>
          </div>

          {activeTab === 'feed' ? (
            <div>
              {group.isMember ? (
                <GroupComposer
                  groupId={groupId}
                  onPostCreated={(newPost) => setPosts(prev => [newPost, ...prev])}
                />
              ) : group.isPrivate ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)', marginBottom: 4 }}>
                    This group is private
                  </h3>
                  <p style={{ color: 'var(--color-ink-soft)', fontSize: 13, marginBottom: 16 }}>
                    Join this group to view discussions and participate.
                  </p>
                  <button className="btn-brand" onClick={handleJoin} style={{ padding: '8px 20px' }}>
                    Join Group
                  </button>
                </div>
              ) : (
                <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, color: 'var(--color-ink)' }}>
                    Join this group to post and participate in discussions.
                  </div>
                  <button className="btn-brand" onClick={handleJoin} style={{ fontSize: 13, padding: '8px 18px' }}>
                    Join Group
                  </button>
                </div>
              )}

              {posts.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-ink)' }}>No posts yet</div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                    Be the first one to post in this group!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)', marginBottom: 16 }}>
                Group Members ({members.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      onClick={() => router.push(`/profile?handle=${m.user.handle}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0, flex: 1 }}
                    >
                      {m.user.avatar ? (
                        <Image src={m.user.avatar} alt={m.user.name} width={40} height={40} className="avatar" unoptimized />
                      ) : (
                        <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)' }}>
                          {m.user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.user.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>@{m.user.handle}</div>
                        {m.role === 'ADMIN' && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 99, marginTop: 2, display: 'inline-block' }}>
                            Admin
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn-ghost"
                      onClick={() => router.push(`/profile?handle=${m.user.handle}`)}
                      style={{ fontSize: 12, padding: '4px 10px', flexShrink: 0 }}
                    >
                      Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {showInviteModal && (
        <InviteFriendsModal
          groupId={groupId}
          groupName={group.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
}