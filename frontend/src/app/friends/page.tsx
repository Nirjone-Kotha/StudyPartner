'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import api from '@/lib/api';

interface FriendUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  friends: number;
}

interface PendingRequest {
  id: string;
  createdAt: string;
  sender: FriendUser;
}

interface SentRequest {
  id: string;
  createdAt: string;
  receiver: FriendUser;
}

interface BlockedRecord {
  id: string;
  type: string;
  blocked: FriendUser;
  createdAt: string;
}

type Tab = 'requests' | 'suggestions' | 'friends' | 'blocked';

function Avatar({ user, size = 52 }: { user: FriendUser; size?: number }) {
  if (user.avatar) return <Image src={user.avatar} alt={user.name} width={size} height={size} className="avatar" unoptimized style={{ width: size, height: size }} />;
  return (
    <div className="avatar" style={{ width: size, height: size, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: 'var(--color-brand)', flexShrink: 0 }}>
      {user.name[0]}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const { user, hydrate } = useAuth();
  const [tab, setTab] = useState<Tab>('requests');
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [sent, setSent] = useState<SentRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [blocked, setBlocked] = useState<BlockedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);// eslint-disable-line

  async function loadAll() {
    setLoading(true);
    try {
      const [pendRes, sentRes, sugRes, frRes, blkRes] = await Promise.all([
        api.get('/friends/requests/pending'),
        api.get('/friends/requests/sent'),
        api.get('/friends/suggestions'),
        api.get('/friends/list'),
        api.get('/messages/blocked').catch(() => ({ data: [] })),
      ]);
      setPending(pendRes.data);
      setSent(sentRes.data);
      setSuggestions(sugRes.data);
      setFriends(frRes.data);
      setBlocked(blkRes.data);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(userId: string) {
    setActionLoading(userId);
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success('Friend request sent!');
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      await loadSent();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not send request');
    } finally {
      setActionLoading(null);
    }
  }

  async function blockUser(userId: string) {
    if (!confirm('Are you sure you want to block this user?')) return;
    setActionLoading(userId);
    try {
      await api.post(`/messages/block/${userId}`, { type: 'ALL' });
      toast.success('User blocked successfully 🚫');
      await loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not block user');
    } finally {
      setActionLoading(null);
    }
  }

  async function unblockUser(userId: string) {
    setActionLoading(userId);
    try {
      await api.post(`/messages/unblock/${userId}`);
      toast.success('User unblocked successfully ✅');
      setBlocked(prev => prev.filter(b => b.blocked.id !== userId));
      await loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not unblock user');
    } finally {
      setActionLoading(null);
    }
  }

  async function acceptRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      await api.post(`/friends/request/${requestId}/accept`);
      toast.success('Friend request accepted! 🎉');
      setPending(prev => prev.filter(r => r.id !== requestId));
      await loadFriends();
    } catch {
      toast.error('Could not accept');
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      await api.post(`/friends/request/${requestId}/reject`);
      toast('Request rejected');
      setPending(prev => prev.filter(r => r.id !== requestId));
    } catch {
      toast.error('Could not reject');
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      await api.delete(`/friends/request/${requestId}`);
      toast('Request cancelled');
      setSent(prev => prev.filter(r => r.id !== requestId));
    } catch {
      toast.error('Could not cancel');
    } finally {
      setActionLoading(null);
    }
  }

  async function unfriend(friendId: string) {
    if (!confirm('Remove this friend?')) return;
    setActionLoading(friendId);
    try {
      await api.delete(`/friends/unfriend/${friendId}`);
      toast('Friend removed');
      setFriends(prev => prev.filter(f => f.id !== friendId));
      await loadSuggestions();
    } catch {
      toast.error('Could not unfriend');
    } finally {
      setActionLoading(null);
    }
  }

  async function loadSent() {
    const { data } = await api.get('/friends/requests/sent');
    setSent(data);
  }
  async function loadFriends() {
    const { data } = await api.get('/friends/list');
    setFriends(data);
  }
  async function loadSuggestions() {
    const { data } = await api.get('/friends/suggestions');
    setSuggestions(data);
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'requests', label: 'Requests', count: pending.length },
    { key: 'suggestions', label: 'Suggestions' },
    { key: 'friends',  label: 'Friends', count: friends.length },
    { key: 'blocked',  label: 'Blocked', count: blocked.length },
  ];

  function UserCard({ u, actions }: { u: FriendUser; actions: React.ReactNode }) {
    return (
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => router.push(`/profile?handle=${u.handle}`)}>
          <Avatar user={u} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)', cursor: 'pointer' }}
            onClick={() => router.push(`/profile?handle=${u.handle}`)}
          >{u.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>@{u.handle}</div>
          {u.friends > 0 && <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>{u.friends} friends</div>}
          {u.bio && <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{u.bio}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {actions}
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
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 4 }}>Friends</h1>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>Connect with your study partners</p>
          </div>

          <div style={{
            display: 'flex', gap: 6, marginBottom: 20,
            width: '100%',
          }}>
            {TABS.map(t => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1, minWidth: 0, whiteSpace: 'nowrap',
                    padding: '9px 4px',
                    border: isActive ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    background: isActive ? 'var(--color-brand)' : 'white',
                    color: isActive ? 'white' : 'var(--color-ink)',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: isActive ? '0 2px 8px rgba(91, 77, 255, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.3)' : 'var(--color-brand-tint)',
                      color: isActive ? 'white' : 'var(--color-brand)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '1px 6px', fontSize: 10, fontWeight: 800,
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ width: '100%', padding: 48, textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 15 }}>
              Loading…
            </div>
          ) : (
            <>
              {/* REQUESTS TAB */}
              {tab === 'requests' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pending.length === 0 && sent.length === 0 && (
                    <div className="card" style={{ width: '100%', padding: 40, textAlign: 'center' }}>
                      <p style={{ fontSize: 32, marginBottom: 10 }}>📭</p>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 15 }}>No pending friend requests</p>
                    </div>
                  )}

                  {pending.length > 0 && (
                    <>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Received Requests ({pending.length})
                      </h2>
                      {pending.map(r => (
                        <UserCard key={r.id} u={r.sender} actions={
                          <>
                            <button
                              className="btn-brand"
                              style={{ padding: '8px 16px', fontSize: 13 }}
                              disabled={actionLoading === r.id}
                              onClick={() => acceptRequest(r.id)}
                            >
                              {actionLoading === r.id ? '…' : 'Accept'}
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ padding: '8px 14px', fontSize: 13 }}
                              disabled={actionLoading === r.id}
                              onClick={() => rejectRequest(r.id)}
                            >
                              Reject
                            </button>
                          </>
                        } />
                      ))}
                    </>
                  )}

                  {sent.length > 0 && (
                    <>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>
                        Sent ({sent.length})
                      </h2>
                      {sent.map(r => (
                        <UserCard key={r.id} u={r.receiver} actions={
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 14px', fontSize: 13, color: 'var(--color-accent)' }}
                            disabled={actionLoading === r.id}
                            onClick={() => cancelRequest(r.id)}
                          >
                            {actionLoading === r.id ? '…' : 'Cancel'}
                          </button>
                        } />
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* SUGGESTIONS TAB */}
              {tab === 'suggestions' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {suggestions.length === 0 ? (
                    <div className="card" style={{ width: '100%', padding: 40, textAlign: 'center' }}>
                      <p style={{ fontSize: 32, marginBottom: 10 }}>🎉</p>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 15 }}>You&apos;ve connected with everyone!</p>
                    </div>
                  ) : (
                    suggestions.map(u => (
                      <UserCard key={u.id} u={u} actions={
                        <button
                          className="btn-brand"
                          style={{ padding: '8px 16px', fontSize: 13 }}
                          disabled={actionLoading === u.id}
                          onClick={() => sendRequest(u.id)}
                        >
                          {actionLoading === u.id ? '…' : 'Add Friend'}
                        </button>
                      } />
                    ))
                  )}
                </div>
              )}

              {/* FRIENDS TAB */}
              {tab === 'friends' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {friends.length === 0 ? (
                    <div className="card" style={{ width: '100%', padding: 40, textAlign: 'center' }}>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 15 }}>No friends yet — send some requests!</p>
                      <button className="btn-brand" style={{ marginTop: 16, padding: '10px 24px' }} onClick={() => setTab('suggestions')}>
                        Find Friends
                      </button>
                    </div>
                  ) : (
                    friends.map(f => (
                      <UserCard key={f.id} u={f} actions={
                        <>
                          <button
                            className="btn-brand"
                            style={{ padding: '8px 14px', fontSize: 13 }}
                            onClick={() => router.push(`/messages?partnerId=${f.id}&name=${encodeURIComponent(f.name)}&handle=${encodeURIComponent(f.handle)}`)}
                          >
                            Message
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 14px', fontSize: 13 }}
                            onClick={() => router.push(`/profile?handle=${f.handle}`)}
                          >
                            Profile
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 14px', fontSize: 13, color: 'var(--color-accent)' }}
                            disabled={actionLoading === f.id}
                            onClick={() => unfriend(f.id)}
                          >
                            Unfriend
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 14px', fontSize: 13, color: '#dc2626' }}
                            disabled={actionLoading === f.id}
                            onClick={() => blockUser(f.id)}
                          >
                            Block
                          </button>
                        </>
                      } />
                    ))
                  )}
                </div>
              )}

              {/* BLOCKED TAB */}
              {tab === 'blocked' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {blocked.length === 0 ? (
                    <div className="card" style={{ width: '100%', padding: 40, textAlign: 'center' }}>
                      <p style={{ color: 'var(--color-ink-soft)', fontSize: 15 }}>No blocked users</p>
                    </div>
                  ) : (
                    blocked.map(b => (
                      <UserCard key={b.id} u={b.blocked} actions={
                        <button
                          className="btn-brand"
                          style={{ padding: '8px 16px', fontSize: 13, background: '#16a34a' }}
                          disabled={actionLoading === b.blocked.id}
                          onClick={() => unblockUser(b.blocked.id)}
                        >
                          {actionLoading === b.blocked.id ? '…' : 'Unblock'}
                        </button>
                      } />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
