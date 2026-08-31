'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { LeftNav } from '@/components/layout/LeftNav';
import { Topbar } from '@/components/layout/Topbar';
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

function Avatar({
  user,
  size = 40,
  online = true,
}: {
  user: Pick<User, 'name' | 'avatar'>;
  size?: number;
  online?: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name}
          width={size}
          height={size}
          className="avatar"
          unoptimized
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div className="avatar" style={{
          width: size, height: size,
          background: 'var(--color-brand-tint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: 'var(--color-brand)',
          borderRadius: '50%',
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
      )}
      {online && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: Math.max(10, Math.round(size * 0.26)),
          height: Math.max(10, Math.round(size * 0.26)),
          background: '#22c55e',
          border: '2px solid white',
          borderRadius: '50%',
        }} />
      )}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isHydrated, hydrate } = useAuth();

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

  const [globalSearchResults, setGlobalSearchResults] = useState<Conversation['partner'][]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search for all users across the platform (friends & non-friends)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearchingGlobal(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get<Conversation['partner'][]>(`/users/search?q=${encodeURIComponent(q)}`);
        setGlobalSearchResults(data || []);
      } catch {
        setGlobalSearchResults([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/');
    }
  }, [isHydrated, user, router]);

  // Load conversations and friends list
  const loadConversations = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

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

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Topbar />
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-ink-faint)', fontSize: 14 }}>
          Loading messages…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isInputDisabled =
    sending ||
    partnerStatus?.isBlockedByMe ||
    partnerStatus?.hasBlockedMe ||
    partnerStatus?.requestStatus === 'DECLINED' ||
    (partnerStatus?.requestStatus === 'PENDING_SENT' && !partnerStatus?.isFriends) ||
    (partnerStatus?.isDeclinedBlocked && !partnerStatus?.isFriends);

  // Filtered queries
  const query = searchQuery.trim().toLowerCase();
  const filteredConversations = query
    ? conversations.filter(c => c.partner.name.toLowerCase().includes(query) || c.partner.handle.toLowerCase().includes(query))
    : conversations;

  const conversationPartnerIds = new Set(filteredConversations.map(c => c.partner.id));
  const filteredFriends = query
    ? friends.filter(f => !conversationPartnerIds.has(f.id) && (f.name.toLowerCase().includes(query) || f.handle.toLowerCase().includes(query)))
    : friends;

  const friendIds = new Set(friends.map(f => f.id));
  const otherUsers = query
    ? globalSearchResults.filter(u => u.id !== user?.id && !conversationPartnerIds.has(u.id) && !friendIds.has(u.id))
    : [];

  // Active friends for Facebook story horizontal row
  const activeOnlineList = friends.length > 0
    ? friends
    : conversations.map(c => c.partner);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />

      <div
        className="messages-container"
        style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', gap: 16,
        }}
      >
        {/* Left sidebar only on desktop */}
        <div className="hide-on-mobile" style={{ width: 240, flexShrink: 0 }}>
          <LeftNav />
        </div>

        {/* Messages layout */}
        <main
          className="messages-main"
          style={{
            flex: 1, display: 'flex', gap: 16, minWidth: 0,
            height: 'calc(100vh - 84px)',
          }}
        >
          {/* Conversation List Panel (Always on desktop, on mobile only when no active thread) */}
          <div
            className={`card messages-card ${activePartner ? 'hide-on-mobile' : ''}`}
            style={{
              width: 340, flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', padding: 0,
              background: 'white',
            }}
          >
            {/* Facebook Messenger Header (Mobile/Desktop) */}
            <div style={{
              padding: '12px 16px 10px',
              borderBottom: '1px solid var(--color-border)',
              background: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => router.push('/feed')}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: 20, color: 'var(--color-ink)', padding: '0 4px',
                      display: 'flex', alignItems: 'center',
                    }}
                    title="Back to Feed"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <h1 style={{
                    fontSize: 22, fontWeight: 800, color: 'var(--color-ink)',
                    letterSpacing: '-0.4px', margin: 0,
                  }}>
                    Messages
                  </h1>
                </div>
              </div>

              {/* Messages Dedicated Search Pill Input (Search chats, friends & all people) */}
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-pill)',
                padding: '7px 14px',
                border: '1px solid var(--color-border)',
                transition: 'border-color 0.15s',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search chats, contacts and people…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: 14,
                    color: 'var(--color-ink)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: 'var(--color-ink-faint)', fontSize: 14, padding: '0 2px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Facebook Style Horizontal Active Friends Avatars Row (NO Short Notes) */}
            {!query && activeOnlineList.length > 0 && (
              <div style={{
                padding: '10px 14px 8px',
                borderBottom: '1px solid var(--color-border)',
                background: 'white',
                display: 'flex', gap: 14,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}>
                {activeOnlineList.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setActivePartner({ id: f.id, name: f.name, handle: f.handle, avatar: f.avatar })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, cursor: 'pointer' }}
                  >
                    <Avatar user={f} size={50} online={true} />
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, color: 'var(--color-ink)',
                      maxWidth: 56, textAlign: 'center', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Facebook Style Conversation Thread List */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
              {loadingConvos ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 14 }}>
                  Loading chats…
                </div>
              ) : (
                (() => {
                  if (query && filteredConversations.length === 0 && filteredFriends.length === 0 && otherUsers.length === 0 && !isSearchingGlobal) {
                    return (
                      <div style={{ padding: 36, textAlign: 'center' }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>No results found</p>
                        <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 4 }}>No chats or people matching &quot;{searchQuery}&quot;</p>
                      </div>
                    );
                  }

                  if (!query && conversations.length === 0 && friends.length === 0) {
                    return (
                      <div style={{ padding: 36, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
                          No conversations yet.<br />Tap any friend above to start chatting.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* Active Recent Conversations */}
                      {filteredConversations.map(({ partner, lastMessage, unreadCount }) => {
                        const isActive = activePartner?.id === partner.id;
                        return (
                          <button
                            key={partner.id}
                            onClick={() => {
                              setActivePartner(partner);
                              if (query) setSearchQuery('');
                            }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                              padding: '12px 16px', border: 'none',
                              background: isActive ? 'var(--color-brand-tint)' : 'white',
                              cursor: 'pointer', textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                          >
                            <Avatar user={partner} size={52} online={true} />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                  fontWeight: unreadCount > 0 ? 800 : 600,
                                  fontSize: 15,
                                  color: 'var(--color-ink)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {partner.name}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                                <span style={{
                                  fontSize: 13,
                                  color: unreadCount > 0 ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                                  fontWeight: unreadCount > 0 ? 700 : 400,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%',
                                }}>
                                  {lastMessage.isOwn ? 'You: ' : ''}{lastMessage.text}
                                  <span style={{ color: 'var(--color-ink-faint)', fontWeight: 400, marginLeft: 6 }}>
                                    · {timeAgo(lastMessage.createdAt)}
                                  </span>
                                </span>

                                {unreadCount > 0 && (
                                  <span style={{
                                    background: '#0084FF', color: 'white',
                                    borderRadius: '50%', width: 20, height: 20,
                                    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* Matching Friends or Suggested Friends */}
                      {(query || conversations.length === 0) && filteredFriends.length > 0 && (
                        <div>
                          <div style={{
                            padding: '12px 16px 6px', fontSize: 12, fontWeight: 700,
                            color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: 'var(--color-bg)',
                          }}>
                            {query ? `Friends & Contacts (${filteredFriends.length})` : 'Start a New Chat'}
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
                                padding: '12px 16px', border: 'none', background: 'white',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
                              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                            >
                              <Avatar user={f} size={48} online={true} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>
                                  {f.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>
                                  @{f.handle}
                                </div>
                              </div>
                              <span style={{
                                fontSize: 12, color: '#0084FF', fontWeight: 700,
                                background: '#eff6ff', padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                              }}>
                                Chat
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Non-Friend Users from Platform Search */}
                      {query && otherUsers.length > 0 && (
                        <div>
                          <div style={{
                            padding: '12px 16px 6px', fontSize: 12, fontWeight: 700,
                            color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: 'var(--color-bg)',
                          }}>
                            People on Study Partner ({otherUsers.length})
                          </div>
                          {otherUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setActivePartner({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar });
                                setSearchQuery('');
                              }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', border: 'none', background: 'white',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
                              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                            >
                              <Avatar user={u} size={48} online={false} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>
                                  {u.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>
                                  @{u.handle}
                                </div>
                              </div>
                              <span style={{
                                fontSize: 12, color: '#0084FF', fontWeight: 700,
                                background: '#eff6ff', padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                              }}>
                                Message
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {isSearchingGlobal && (
                        <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--color-ink-faint)' }}>
                          Searching people…
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Facebook Direct Chat Thread Panel (On mobile only when activePartner exists, on desktop always) */}
          <div
            className={`card messages-card ${!activePartner ? 'hide-on-mobile' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', padding: 0, minWidth: 0,
              background: 'white',
            }}
          >
            {!activePartner ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14,
                color: 'var(--color-ink-faint)', padding: 32,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: 'var(--color-brand-tint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Your Messages</p>
                <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--color-ink-soft)', maxWidth: 280 }}>
                  Select a chat or message a friend to start a conversation.
                </p>
              </div>
            ) : (
              <>
                {/* Facebook Chat Header */}
                <div style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setActivePartner(null)}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: 'var(--color-brand)', padding: '6px 4px',
                        display: 'flex', alignItems: 'center',
                      }}
                      title="Back to conversation list"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <Avatar user={activePartner} size={40} online={true} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>{activePartner.name}</div>
                      <div style={{ fontSize: 11.5, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Active now
                      </div>
                    </div>
                  </div>

                  {/* Header Actions (Block / Unblock / Profile) */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowBlockMenu(v => !v)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: 'none', background: 'var(--color-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-ink)', cursor: 'pointer',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>

                    {showBlockMenu && (
                      <div style={{
                        position: 'absolute', right: 0, top: 42, width: 210,
                        background: 'white', borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)',
                        zIndex: 50, padding: 6,
                      }}>
                        <button
                          onClick={() => { setShowBlockMenu(false); router.push(`/profile?handle=${activePartner.handle}`); }}
                          style={{
                            width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                            textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 6,
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
                              width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                              textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 6,
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
                                width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                                textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                                display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626',
                              }}
                            >
                              Block Messages
                            </button>
                            <button
                              onClick={() => handleBlock('ALL')}
                              disabled={actionLoading}
                              style={{
                                width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                                textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 6,
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
                    padding: '12px 16px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0',
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
                    padding: '10px 16px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe',
                    fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    Message request sent. You can chat freely once they accept.
                  </div>
                )}

                {partnerStatus?.requestStatus === 'DECLINED' && (
                  <div style={{
                    padding: '10px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca',
                    fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    This user declined your message request.
                  </div>
                )}

                {partnerStatus?.isBlockedByMe && (
                  <div style={{
                    padding: '10px 16px', background: '#fff1f2', borderBottom: '1px solid #fecdd3',
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
                    padding: '10px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca',
                    fontSize: 13, color: '#991b1b',
                  }}>
                    This user has blocked you. Messages cannot be delivered.
                  </div>
                )}

                {/* Facebook Style Chat Bubble Messages Area */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  background: '#F0F2F5',
                }}>
                  {loadingThread ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 14, marginTop: 40 }}>
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{
                      textAlign: 'center', marginTop: 40, padding: 24,
                      background: 'white', borderRadius: 16, margin: '20px auto', maxWidth: 300,
                    }}>
                      <Avatar user={activePartner} size={64} online={true} />
                      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10, color: 'var(--color-ink)' }}>{activePartner.name}</div>
                      <p style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                        {!partnerStatus?.isFriends
                          ? `Send a message to start chatting with ${activePartner.name}`
                          : `You're connected on Study Partner`}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender.id === user.id;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: isOwn ? 'row-reverse' : 'row',
                            alignItems: 'flex-end', gap: 8,
                          }}
                        >
                          {!isOwn && <Avatar user={msg.sender} size={28} online={false} />}
                          <div style={{
                            maxWidth: '72%',
                            padding: '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? '#0084FF' : 'white',
                            color: isOwn ? 'white' : 'var(--color-ink)',
                            fontSize: 14.5, lineHeight: 1.45,
                            wordBreak: 'break-word',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          }}>
                            {msg.text}
                            <div style={{
                              fontSize: 10,
                              color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--color-ink-faint)',
                              marginTop: 3, textAlign: 'right',
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

                {/* Facebook Messenger Input Bar */}
                <form
                  onSubmit={sendMessage}
                  style={{
                    padding: '10px 14px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: isInputDisabled ? '#f9fafb' : 'white',
                  }}
                >
                  <input
                    className="input"
                    placeholder={
                      partnerStatus?.isBlockedByMe
                        ? 'You have blocked this user…'
                        : partnerStatus?.hasBlockedMe
                        ? 'Unable to send messages…'
                        : partnerStatus?.requestStatus === 'PENDING_SENT' && !partnerStatus?.isFriends
                        ? 'Message request pending…'
                        : 'Aa'
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{
                      flex: 1, margin: 0,
                      borderRadius: 'var(--radius-pill)',
                      padding: '10px 16px',
                      fontSize: 14.5,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                    }}
                    autoFocus={!isInputDisabled}
                    disabled={isInputDisabled}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || isInputDisabled}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: text.trim() && !isInputDisabled ? '#0084FF' : '#e2e8f0',
                      color: 'white', border: 'none', cursor: text.trim() && !isInputDisabled ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.15s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
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
