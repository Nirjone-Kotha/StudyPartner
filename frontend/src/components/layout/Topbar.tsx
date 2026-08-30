'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { User, NotificationItem } from '@/types';

interface SearchResult {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  friends: number;
}

export function Topbar() {
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unread messages count
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const { data } = await api.get<{ count: number }>('/messages/unread');
        setUnreadMessages(data?.count || 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, [user]);

  // Notifications fetch & poll
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.get<NotificationItem[]>('/notifications').catch(() => ({ data: [] })),
        api.get<{ count: number }>('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
      ]);
      if (notifsRes?.data) setNotifications(notifsRes.data);
      if (countRes?.data) setUnreadNotifications(countRes.data.count || 0);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  const handleOpenNotifications = () => {
    setShowNotifications(v => {
      const next = !v;
      if (next) {
        setNotificationsLoading(true);
        fetchNotifications().finally(() => setNotificationsLoading(false));
      }
      return next;
    });
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadNotifications(c => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    setShowNotifications(false);
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    } else if (notif.actor) {
      router.push(`/profile?handle=${notif.actor.handle}`);
    }
  };

  // PWA Install state
  const [showInstallMenu, setShowInstallMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const installMenuRef = useRef<HTMLDivElement>(null);

  // Detect PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }
    window.addEventListener('appinstalled', () => setIsPWAInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (installMenuRef.current && !installMenuRef.current.contains(e.target as Node)) {
        setShowInstallMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);


  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(q.trim())}`);
      setSearchResults(data);
    } catch {
      // Fallback: search from contacts
      try {
        const { data } = await api.get<User[]>('/users/contacts');
        const filtered = data.filter(u =>
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.handle.toLowerCase().includes(q.toLowerCase())
        ) as SearchResult[];
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    setShowSearchDropdown(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => doSearch(q), 350);
    } else {
      setSearchResults([]);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      searchInputRef.current?.blur();
    }
    if (e.key === 'Enter' && searchResults.length > 0) {
      goToProfile(searchResults[0].handle);
    }
  }

  function goToProfile(handle: string) {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/profile?handle=${handle}`);
  }

  // Direct PWA Install / App Download handler
  async function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsPWAInstalled(true);
        toast.success('App installed successfully');
        return;
      }
    }
    // Direct shortcut/installer file download for Windows/Mac/Linux/Android
    try {
      const shortcut = `[InternetShortcut]\nURL=${window.location.origin}\nIconIndex=0\nIconFile=${window.location.origin}/favicon.ico\n`;
      const blob = new Blob([shortcut], { type: 'application/internet-shortcut' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'StudyPartner-App.url';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('App installer downloaded');
    } catch {
      toast.success('Ready to install from browser menu');
    }
  }

  function handleLogout() {
    clearAuth();
    router.push('/');
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 16px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/feed')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Home"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="var(--color-brand)"/>
            <path d="M7 10C7 9.44772 7.44772 9 8 9H14C15.1046 9 16 9.89543 16 11V22C16 22 14.5 21 12 21H8C7.44772 21 7 20.5523 7 20V10Z" fill="white" fillOpacity="0.9"/>
            <path d="M25 10C25 9.44772 24.5523 9 24 9H18C16.8954 9 16 9.89543 16 11V22C16 22 17.5 21 20 21H24C24.5523 21 25 20.5523 25 20V10Z" fill="white" fillOpacity="0.7"/>
            <rect x="9" y="12" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
            <rect x="9" y="14.5" width="4" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
            <rect x="9" y="17" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
            <rect x="18" y="12" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
            <rect x="18" y="14.5" width="4" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
            <rect x="18" y="17" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
            <rect x="15.2" y="10" width="1.6" height="12" rx="0.8" fill="white"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--color-brand)', letterSpacing: '-0.3px' }}
            className="hide-on-mobile">
            Study Partner
          </span>
        </button>

        {/* Search Bar */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, pointerEvents: 'none', color: 'var(--color-ink-faint)',
            }}>
              {searchLoading ? '⏳' : '🔍'}
            </span>
            <input
              ref={searchInputRef}
              className="input"
              placeholder="Search people..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                setShowSearchDropdown(true);
                if (searchQuery.trim().length >= 2) doSearch(searchQuery);
              }}
              style={{ padding: '8px 16px 8px 36px', fontSize: 14, borderRadius: 'var(--radius-pill)' }}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); searchInputRef.current?.focus(); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: 16, lineHeight: 1 }}
                aria-label="Clear search"
              >×</button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (searchQuery.trim().length >= 2) && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'white', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
              zIndex: 300, overflow: 'hidden', maxHeight: 360, overflowY: 'auto',
            }}>
              {searchLoading && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 13 }}>
                  Searching…
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>
                    No results found for "{searchQuery}"
                  </div>
                </div>
              )}
              {!searchLoading && searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => goToProfile(result.handle)}
                  style={{
                    width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {result.avatar ? (
                    <Image src={result.avatar} alt={result.name} width={40} height={40} className="avatar" unoptimized />
                  ) : (
                    <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--color-brand)', flexShrink: 0 }}>
                      {result.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {result.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>@{result.handle}</div>
                    {result.bio && (
                      <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {result.bio}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-faint)', flexShrink: 0 }}>
                    {result.friends} friends
                  </span>
                </button>
              ))}
              {!searchLoading && searchResults.length > 0 && (
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-ink-faint)', textAlign: 'center' }}>
                  {searchResults.length} people found · Press Enter to visit profile
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Install App Direct One-Click Action */}
          {!isPWAInstalled && (
            <button
              onClick={handleInstallApp}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', border: '1.5px solid var(--color-brand)',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                background: 'white',
                color: 'var(--color-brand)', fontSize: 12, fontWeight: 700,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-brand-tint)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
              title="Install Official App"
            >
              <span className="hide-on-mobile">Install App</span>
              <span className="show-on-mobile">Install</span>
            </button>
          )}

          {isPWAInstalled && (
            <span style={{
              padding: '5px 10px', background: 'var(--color-brand-tint)', color: 'var(--color-brand)',
              borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700,
            }}>✅ Installed</span>
          )}

          {/* Nav icons - desktop only */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                router.push('/feed');
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('refresh-feed'));
                }
              }}
              style={{ padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: 18 }}
              title="Home"
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >🏠</button>

            {/* Notifications with Dropdown */}
            <div ref={notifMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={handleOpenNotifications}
                style={{
                  position: 'relative', padding: '8px 10px', border: 'none',
                  background: showNotifications ? 'var(--color-brand-tint)' : 'none',
                  cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: 18,
                  transition: 'background 0.15s',
                }}
                title="Notifications"
                onMouseOver={(e) => { if (!showNotifications) e.currentTarget.style.background = 'var(--color-bg)'; }}
                onMouseOut={(e) => { if (!showNotifications) e.currentTarget.style.background = 'none'; }}
              >
                🔔
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    background: 'var(--color-accent)', color: 'white',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white',
                  }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: -40,
                  background: 'white', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  width: 360, maxWidth: '90vw', zIndex: 300, overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>
                      Notifications
                      {unreadNotifications > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={handleMarkAllNotifsRead}
                        style={{
                          border: 'none', background: 'none', cursor: 'pointer',
                          color: 'var(--color-brand)', fontSize: 12, fontWeight: 600,
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notificationsLoading && (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 13 }}>
                        Loading notifications…
                      </div>
                    )}
                    {!notificationsLoading && notifications.length === 0 && (
                      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>No notifications yet</div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 4 }}>You'll see new updates and alerts here</div>
                      </div>
                    )}
                    {!notificationsLoading && notifications.map((notif) => {
                      const timeStr = new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const getIcon = (t: string) => {
                        switch (t) {
                          case 'LIKE': return '❤️';
                          case 'COMMENT': return '💬';
                          case 'FRIEND_REQUEST':
                          case 'FRIEND_ACCEPT': return '👥';
                          case 'GROUP_INVITE':
                          case 'GROUP_POST': return '🎓';
                          case 'ADMIN_ANNOUNCEMENT': return '📢';
                          default: return '🔔';
                        }
                      };

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                            display: 'flex', gap: 12, cursor: 'pointer',
                            background: notif.read ? 'white' : 'var(--color-brand-tint)',
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = notif.read ? 'var(--color-bg)' : 'rgba(108,76,250,0.12)')}
                          onMouseOut={(e) => (e.currentTarget.style.background = notif.read ? 'white' : 'var(--color-brand-tint)')}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {notif.actor?.avatar ? (
                              <Image src={notif.actor.avatar} alt={notif.actor.name} width={38} height={38} className="avatar" unoptimized />
                            ) : (
                              <div className="avatar" style={{ width: 38, height: 38, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--color-brand)' }}>
                                {notif.actor?.name?.[0] || '🔔'}
                              </div>
                            )}
                            <span style={{
                              position: 'absolute', bottom: -2, right: -2, fontSize: 12,
                              background: 'white', borderRadius: '50%', padding: '1px',
                            }}>{getIcon(notif.type)}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                              <strong style={{ fontWeight: 700 }}>{notif.actor?.name || notif.title}</strong>{' '}
                              <span>{notif.message}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 4 }}>
                              {timeStr}
                            </div>
                          </div>
                          {!notif.read && (
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: 'var(--color-brand)', alignSelf: 'center', flexShrink: 0,
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/messages')}
              style={{ position: 'relative', padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: 18 }}
              title="Messages"
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >
              💬
              {unreadMessages > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  background: 'var(--color-brand)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                }}>{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              )}
            </button>
          </div>

          {/* Admin */}
          {user?.isAdmin && (
            <button
              className="btn-ghost hide-on-mobile"
              onClick={() => router.push('/admin/dashboard')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >⚙️ Admin</button>
          )}

          {/* Profile Dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: 'none', background: showUserMenu ? 'var(--color-bg)' : 'none',
                cursor: 'pointer', padding: '4px 6px', borderRadius: 'var(--radius-pill)',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              onMouseOut={(e) => { if (!showUserMenu) e.currentTarget.style.background = 'none'; }}
              aria-label="Profile menu"
            >
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} width={32} height={32} className="avatar" unoptimized />
              ) : (
                <div className="avatar" style={{ width: 32, height: 32, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--color-brand)' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }} className="hide-on-mobile">▾</span>
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'white', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                minWidth: 220, zIndex: 300, overflow: 'hidden',
              }}>
                <div
                  onClick={() => { setShowUserMenu(false); router.push(`/profile?handle=${user?.handle}`); }}
                  style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    background: 'white', transition: 'background 0.1s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                >
                  {user?.avatar ? (
                    <Image src={user.avatar} alt={user.name || ''} width={38} height={38} className="avatar" unoptimized />
                  ) : (
                    <div className="avatar" style={{ width: 38, height: 38, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--color-brand)' }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>@{user?.handle}</div>
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (user?.handle) router.push(`/profile?handle=${user.handle}`);
                    }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 16 }}>👤</span> View Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/groups');
                    }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 16 }}>👥</span> My Groups
                  </button>

                  {user?.isAdmin && (
                    <button
                      onClick={() => { setShowUserMenu(false); router.push('/admin/dashboard'); }}
                      style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 16 }}>⚙️</span> Admin Panel
                    </button>
                  )}
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 0' }} />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#dc2626', textAlign: 'left', fontWeight: 600 }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 16 }}>🚪</span> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

