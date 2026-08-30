'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { LeftNav } from '@/components/layout/LeftNav';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import type { Conversation, Message, User } from '@/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function Avatar({ user, size = 40 }: { user: Pick<User, 'name' | 'avatar'>; size?: number }) {
  if (user.avatar) {
    return (
      <Image
        src={user.avatar} alt={user.name}
        width={size} height={size}
        className="avatar" unoptimized
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    );
  }
  return (
    <div className="avatar" style={{
      width: size, height: size, flexShrink: 0,
      background: 'var(--color-brand-tint)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'var(--color-brand)',
    }}>
      {user.name?.[0]?.toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrate } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Conversation['partner'][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePartner, setActivePartner] = useState<Conversation['partner'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<{
    isFriends: boolean;
    requestStatus: string;
    isBlockedByMe: boolean;
    hasBlockedMe: boolean;
    blockType: string | null;
    messageDeclines: number;
    isDeclinedBlocked: boolean;
    canSendOneMessage: boolean;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (user === null) router.replace('/');
  }, [user, router]);

  // Load conversations and friends list
  const loadConversations = useCallback(async () => {
    try {
      const [convRes, friendRes] = await Promise.all([
        api.get<Conversation[]>('/messages/conversations'),
        api.get<Conversation['partner'][]>('/friends/list').catch(() => ({ data: [] })),
      ]);
      setConversations(convRes.data || []);
      setFriends(friendRes.data || []);
    } catch {
      // silent
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadPartnerStatus = useCallback(async (pid: string) => {
    try {
      const { data } = await api.get(`/messages/status/${pid}`);
      setPartnerStatus(data);
    } catch {
      // silent
    }
  }, []);

  // Open a thread from query param (e.g. /messages?partnerId=xxx)
  useEffect(() => {
    const pid = searchParams.get('partnerId');
    const pname = searchParams.get('name');
    const phandle = searchParams.get('handle');
    if (pid && pname && phandle) {
      setActivePartner({ id: pid, name: pname, handle: phandle });
    }
  }, [searchParams]);

  // Load thread + poll
  useEffect(() => {
    if (!activePartner) return;

    loadPartnerStatus(activePartner.id);

    async function loadThread() {
      setLoadingThread(true);
      try {
        const { data } = await api.get<Message[]>(`/messages/thread/${activePartner!.id}`);
        setMessages(data);
      } catch {
        toast.error('Could not load messages');
      } finally {
        setLoadingThread(false);
      }
    }

    loadThread();

    // Poll every 4s for new messages
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get<Message[]>(`/messages/thread/${activePartner!.id}`);
        setMessages(data);
        loadConversations();
      } catch {
        // silent
      }
    }, 4000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activePartner, loadConversations, loadPartnerStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;
    setSending(true);
    try {
      const { data } = await api.post<Message>(`/messages/send/${activePartner.id}`, { text });
      setMessages(prev => [...prev, data]);
      setText('');
      loadConversations();
      loadPartnerStatus(activePartner.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptRequest() {
    if (!activePartner) return;
    setActionLoading(true);
    try {
      await api.post(`/messages/requests/${activePartner.id}/accept`);
      toast.success('Message request accepted');
      loadPartnerStatus(activePartner.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not accept request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeclineRequest() {
    if (!activePartner) return;
    setActionLoading(true);
    try {
      await api.post(`/messages/requests/${activePartner.id}/decline`);
      toast.success('Message request declined');
      loadPartnerStatus(activePartner.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not decline request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBlock(type: 'MESSAGE' | 'ALL') {
    if (!activePartner) return;
    setActionLoading(true);
    try {
      await api.post(`/messages/block/${activePartner.id}`, { type });
      toast.success(type === 'MESSAGE' ? 'Messages blocked' : 'User blocked completely');
      setShowBlockMenu(false);
      loadPartnerStatus(activePartner.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not block user');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnblock() {
    if (!activePartner) return;
    setActionLoading(true);
    try {
      await api.post(`/messages/unblock/${activePartner.id}`);
      toast.success('User unblocked');
      setShowBlockMenu(false);
      loadPartnerStatus(activePartner.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not unblock user');
    } finally {
      setActionLoading(false);
    }
  }

  if (!user) return null;

  const isInputDisabled =
    sending ||
    partnerStatus?.isBlockedByMe ||
    partnerStatus?.hasBlockedMe ||
    partnerStatus?.requestStatus === 'DECLINED' ||
    (partnerStatus?.requestStatus === 'PENDING_SENT' && !partnerStatus?.isFriends) ||
    (partnerStatus?.isDeclinedBlocked && !partnerStatus?.isFriends);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />

      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 16px',
        display: 'flex', gap: 20, paddingTop: 76,
      }}>
        <LeftNav />

        {/* Messages layout */}
        <main style={{ flex: 1, display: 'flex', gap: 16, minWidth: 0, height: 'calc(100vh - 96px)' }}>
          {/* Sidebar: Conversations & Friends */}
          <div className="card" style={{
            width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', padding: 0,
          }}>
            {/* Header + Telegram-style Search Bar */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Messages</h2>
                <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontWeight: 600 }}>
                  {conversations.length} chats
                </span>
              </div>

              {/* Search Bar */}
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 12px',
                border: '1px solid var(--color-border)',
                transition: 'border-color 0.15s',
              }}>
                <span style={{ color: 'var(--color-ink-faint)', fontSize: 13, marginRight: 8, display: 'flex', alignItems: 'center' }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search friends or chats…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: 13,
                    color: 'var(--color-ink)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-ink-faint)',
                      fontSize: 13,
                      padding: '0 2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingConvos ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 14 }}>Loading…</div>
              ) : (
                (() => {
                  const query = searchQuery.trim().toLowerCase();
                  const filteredConversations = query
                    ? conversations.filter(c => c.partner.name.toLowerCase().includes(query) || c.partner.handle.toLowerCase().includes(query))
                    : conversations;

                  const conversationPartnerIds = new Set(filteredConversations.map(c => c.partner.id));
                  const filteredFriends = query
                    ? friends.filter(f => !conversationPartnerIds.has(f.id) && (f.name.toLowerCase().includes(query) || f.handle.toLowerCase().includes(query)))
                    : [];

                  if (query && filteredConversations.length === 0 && filteredFriends.length === 0) {
                    return (
                      <div style={{ padding: 36, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>No results found</p>
                        <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>No friends or conversations matching &quot;{searchQuery}&quot;</p>
                      </div>
                    );
                  }

                  if (!query && conversations.length === 0) {
                    return (
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>No conversations yet.<br />Search a friend above to start chatting.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Matching Active Conversations */}
                      {filteredConversations.length > 0 && (
                        <div>
                          {query && (
                            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Recent Chats ({filteredConversations.length})
                            </div>
                          )}
                          {filteredConversations.map(({ partner, lastMessage, unreadCount }) => {
                            const isActive = activePartner?.id === partner.id;
                            return (
                              <button
                                key={partner.id}
                                onClick={() => setActivePartner(partner)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 16px', border: 'none', borderRadius: 0,
                                  background: isActive ? 'var(--color-brand-tint)' : 'transparent',
                                  cursor: 'pointer', textAlign: 'left',
                                  borderBottom: '1px solid var(--color-border)',
                                  transition: 'background 0.15s',
                                }}
                              >
                                <Avatar user={partner} size={42} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: unreadCount > 0 ? 700 : 600, fontSize: 14, color: 'var(--color-ink)' }}>
                                      {partner.name}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>
                                      {timeAgo(lastMessage.createdAt)}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                                    <span style={{
                                      fontSize: 12,
                                      color: unreadCount > 0 ? 'var(--color-ink-soft)' : 'var(--color-ink-faint)',
                                      fontWeight: unreadCount > 0 ? 600 : 400,
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170,
                                    }}>
                                      {lastMessage.isOwn ? 'You: ' : ''}{lastMessage.text}
                                    </span>
                                    {unreadCount > 0 && (
                                      <span style={{
                                        background: 'var(--color-brand)', color: 'white',
                                        borderRadius: '50%', width: 18, height: 18,
                                        fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                      }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Matching Friends who don't have an active conversation yet */}
                      {filteredFriends.length > 0 && (
                        <div>
                          <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg)' }}>
                            Friends / Start Chat ({filteredFriends.length})
                          </div>
                          {filteredFriends.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                setActivePartner({ id: f.id, name: f.name, handle: f.handle, avatar: f.avatar });
                                setSearchQuery('');
                              }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 16px', border: 'none', borderRadius: 0,
                                background: 'white',
                                cursor: 'pointer', textAlign: 'left',
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-brand-tint)')}
                              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                            >
                              <Avatar user={f} size={38} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--color-ink)' }}>
                                  {f.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>
                                  @{f.handle}
                                </div>
                              </div>
                              <span style={{
                                fontSize: 11.5, color: 'var(--color-brand)', fontWeight: 600,
                                background: 'var(--color-brand-tint)', padding: '4px 8px', borderRadius: 12,
                              }}>
                                Chat
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </div>

          {/* Thread panel */}
          <div className="card" style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', padding: 0, minWidth: 0,
          }}>
            {!activePartner ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                color: 'var(--color-ink-faint)', padding: 32,
              }}>
                <p style={{ fontSize: 15, textAlign: 'center', color: 'var(--color-ink-soft)' }}>
                  Select a conversation from the left<br />or message a friend to start chatting.
                </p>
                <button
                  className="btn-brand"
                  onClick={() => router.push('/friends')}
                  style={{ marginTop: 8 }}
                >
                  View Friends
                </button>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div style={{
                  padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => setActivePartner(null)}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: 18, padding: '4px 8px 4px 0', color: 'var(--color-ink-soft)',
                      }}
                      className="show-on-mobile"
                    >←</button>
                    <Avatar user={activePartner} size={38} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>{activePartner.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>@{activePartner.handle}</div>
                    </div>
                  </div>

                  {/* Header Actions (Block / Unblock / Profile) */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowBlockMenu(v => !v)}
                      style={{
                        border: '1px solid var(--color-border)', background: 'transparent',
                        padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--color-ink-soft)',
                      }}
                    >
                      Options
                    </button>

                    {showBlockMenu && (
                      <div style={{
                        position: 'absolute', right: 0, top: 38, width: 210,
                        background: 'white', borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)',
                        zIndex: 50, padding: 6,
                      }}>
                        <button
                          onClick={() => { setShowBlockMenu(false); router.push(`/profile?handle=${activePartner.handle}`); }}
                          style={{
                            width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                            textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4,
                            display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-ink)',
                          }}
                        >
                          View Profile
                        </button>

                        {partnerStatus?.isBlockedByMe ? (
                          <button
                            onClick={handleUnblock}
                            disabled={actionLoading}
                            style={{
                              width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                              textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4,
                              display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600,
                            }}
                          >
                            Unblock User
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleBlock('MESSAGE')}
                              disabled={actionLoading}
                              style={{
                                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                                textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4,
                                display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626',
                              }}
                            >
                              Block Messages
                            </button>
                            <button
                              onClick={() => handleBlock('ALL')}
                              disabled={actionLoading}
                              style={{
                                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                                textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4,
                                display: 'flex', alignItems: 'center', gap: 8, color: '#991b1b', fontWeight: 600,
                              }}
                            >
                              Block Completely
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Alert Banners */}
                {partnerStatus?.requestStatus === 'PENDING_RECEIVED' && (
                  <div style={{
                    padding: '12px 20px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                  }}>
                    <div style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                      <strong>{activePartner.name}</strong> sent you a message request.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-brand"
                        onClick={handleAcceptRequest}
                        disabled={actionLoading}
                        style={{ fontSize: 12, padding: '6px 14px', background: '#16a34a' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleDeclineRequest}
                        disabled={actionLoading}
                        style={{
                          fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid #f87171', background: 'white', color: '#dc2626', cursor: 'pointer',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {partnerStatus?.requestStatus === 'PENDING_SENT' && !partnerStatus?.isFriends && (
                  <div style={{
                    padding: '10px 20px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe',
                    fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    Message request sent. You can chat freely once they accept.
                  </div>
                )}

                {partnerStatus?.requestStatus === 'DECLINED' && (
                  <div style={{
                    padding: '10px 20px', background: '#fef2f2', borderBottom: '1px solid #fecaca',
                    fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    This user declined your message request.
                  </div>
                )}

                {partnerStatus?.isBlockedByMe && (
                  <div style={{
                    padding: '10px 20px', background: '#fff1f2', borderBottom: '1px solid #fecdd3',
                    fontSize: 13, color: '#be123c', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>You have blocked this user.</span>
                    <button
                      onClick={handleUnblock}
                      style={{
                        padding: '4px 10px', fontSize: 12, background: 'white',
                        border: '1px solid #be123c', color: '#be123c', borderRadius: 4, cursor: 'pointer',
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                )}

                {partnerStatus?.hasBlockedMe && (
                  <div style={{
                    padding: '10px 20px', background: '#fef2f2', borderBottom: '1px solid #fecaca',
                    fontSize: 13, color: '#991b1b',
                  }}>
                    This user has blocked you. Messages cannot be delivered.
                  </div>
                )}

                {partnerStatus?.isDeclinedBlocked && !partnerStatus?.isFriends && (
                  <div style={{
                    padding: '10px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a',
                    fontSize: 13, color: '#92400e',
                  }}>
                    Non-friend message requests are temporarily restricted.
                  </div>
                )}

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingThread ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 14, marginTop: 40 }}>Loading thread…</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                      <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
                        {!partnerStatus?.isFriends
                          ? `Send an introduction or request message to ${activePartner.name}`
                          : `Start a conversation with ${activePartner.name}`}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender.id === user.id;
                      return (
                        <div key={msg.id} style={{
                          display: 'flex',
                          flexDirection: isOwn ? 'row-reverse' : 'row',
                          alignItems: 'flex-end', gap: 8,
                        }}>
                          {!isOwn && <Avatar user={msg.sender} size={28} />}
                          <div style={{
                            maxWidth: '68%',
                            padding: '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? 'var(--color-brand)' : 'var(--color-bg)',
                            color: isOwn ? 'white' : 'var(--color-ink)',
                            fontSize: 14, lineHeight: 1.5,
                            wordBreak: 'break-word',
                            boxShadow: 'var(--shadow-sm)',
                          }}>
                            {msg.text}
                            <div style={{
                              fontSize: 10,
                              color: isOwn ? 'rgba(255,255,255,0.65)' : 'var(--color-ink-faint)',
                              marginTop: 4, textAlign: 'right',
                            }}>
                              {timeAgo(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex', gap: 10, alignItems: 'center',
                  background: isInputDisabled ? '#f9fafb' : 'white',
                }}>
                  <input
                    className="input"
                    placeholder={
                      partnerStatus?.isBlockedByMe
                        ? 'You have blocked this user…'
                        : partnerStatus?.hasBlockedMe
                        ? 'Unable to send messages…'
                        : partnerStatus?.requestStatus === 'PENDING_SENT' && !partnerStatus?.isFriends
                        ? 'Message request already pending…'
                        : `Message ${activePartner.name}…`
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ flex: 1, margin: 0 }}
                    autoFocus={!isInputDisabled}
                    disabled={isInputDisabled}
                  />
                  <button
                    type="submit"
                    className="btn-brand"
                    disabled={!text.trim() || isInputDisabled}
                    style={{ flexShrink: 0, padding: '10px 18px', opacity: isInputDisabled ? 0.5 : 1 }}
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Topbar />
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-ink-faint)' }}>Loading messages…</div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
