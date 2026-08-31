'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

// ─── Invite / Share Modal ────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studypartner.app';
  const shareText = 'Join me on Study Partner — Connect, collaborate & learn together!';
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(appUrl);
  const [copied, setCopied] = useState(false);

  const channels = [
    {
      name: 'WhatsApp',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.536 4.06 1.474 5.774L0 24l6.379-1.447A11.932 11.932 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 0 1-5.001-1.374l-.358-.214-3.724.844.9-3.632-.234-.373A9.773 9.773 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
      ),
      bg: '#dcfce7',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#229ED9">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.288c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.933z"/>
        </svg>
      ),
      bg: '#e0f2fe',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      bg: '#eff6ff',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter / X',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#000">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bg: '#f8f8f8',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'SMS',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C4CFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      bg: '#f3e8ff',
      href: `sms:?body=${encodedText} ${appUrl}`,
    },
    {
      name: 'Email',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      bg: '#fce7f3',
      href: `mailto:?subject=${encodeURIComponent('Join me on Study Partner')}&body=${encodeURIComponent(shareText + '\n\n' + appUrl)}`,
    },
  ];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = appUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Study Partner', text: shareText, url: appUrl });
      } catch { /* user cancelled */ }
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', zIndex: 1200,
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        maxHeight: '88vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 99, margin: '0 auto 16px' }} />
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--color-ink)' }}>Invite Friends</div>
        <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 20 }}>Share Study Partner and start learning together</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 22, background: 'var(--color-bg)', borderRadius: 12, padding: '10px 14px', alignItems: 'center', border: '1px solid var(--color-border)' }}>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--color-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUrl}</span>
          <button
            onClick={handleCopy}
            style={{ background: copied ? '#22c55e' : 'var(--color-brand)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
          >{copied ? '✓ Copied!' : 'Copy'}</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
          {channels.map((ch) => (
            <a
              key={ch.name}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 8px', background: ch.bg, borderRadius: 14,
                textDecoration: 'none', border: 'none',
              }}
            >
              {ch.icon}
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-ink)', textAlign: 'center' }}>{ch.name}</span>
            </a>
          ))}
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            style={{
              width: '100%', padding: '14px', border: '1.5px solid var(--color-brand)',
              borderRadius: 14, background: 'white', color: 'var(--color-brand)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            More Share Options
          </button>
        )}

        <button
          onClick={onClose}
          style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 14, background: 'var(--color-bg)', color: 'var(--color-ink-soft)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
        >Cancel</button>
      </div>
    </>
  );
}

// ─── Facebook Style Slide-Out Menu Drawer ─────────────────────────────────────
function MenuDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const items = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: 'Your Profile',
      action: () => { router.push(`/profile?handle=${user?.handle}`); onClose(); },
      color: '#6C4CFA',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
      label: 'Invite Friends',
      action: () => { setShowInvite(true); },
      color: '#e91e63',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      label: 'Messages',
      action: () => { router.push('/messages'); onClose(); },
      color: '#0084ff',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Groups',
      action: () => { router.push('/groups'); onClose(); },
      color: '#2196F3',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Friends',
      action: () => { router.push('/friends'); onClose(); },
      color: '#4CAF50',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
      ),
      label: 'Saved',
      action: () => { router.push('/saved'); onClose(); },
      color: '#9C27B0',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Feed',
      action: () => { router.push('/feed'); onClose(); },
      color: '#FF9800',
    },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 999, backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 360,
        background: 'var(--color-bg)', zIndex: 1000,
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '18px 20px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-brand)' }}>Menu</span>
          <button
            onClick={onClose}
            style={{ background: 'var(--color-bg)', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--color-ink-soft)' }}
          >×</button>
        </div>

        {user && (
          <button
            onClick={() => { router.push(`/profile?handle=${user.handle}`); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', border: 'none', background: 'none',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} width={56} height={56} className="avatar" unoptimized />
            ) : (
              <div className="avatar" style={{
                width: 56, height: 56, background: 'var(--color-brand-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: 'var(--color-brand)', flexShrink: 0,
              }}>{user.name[0]}</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)' }}>{user.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>View your profile</div>
            </div>
          </button>
        )}

        <div style={{ padding: '16px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                background: 'white', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '16px 14px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ color: item.color }}>{item.icon}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Log out option at bottom of menu */}
        <div style={{ padding: '12px 16px 24px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => {
              clearAuth();
              onClose();
              router.push('/');
            }}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              border: 'none', background: '#fee2e2', color: '#dc2626',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Log Out
          </button>
        </div>
      </div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  );
}

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isPWAStandalone, setIsPWAStandalone] = useState(false);

  // Detect PWA install prompt and standalone mode
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (standalone) {
      setIsPWAInstalled(true);
      setIsPWAStandalone(true);
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
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* ─── Top Row: Logo, Search, Desktop/Mobile Actions ─── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 16px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-brand)', letterSpacing: '-0.3px' }}>
            Study Partner
          </span>
        </button>

        {/* Desktop Search Bar */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 380, position: 'relative' }} className="hide-on-mobile">
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
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Mobile search toggle button */}
          <button
            onClick={() => setShowMobileSearch(v => !v)}
            className="show-on-mobile"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: showMobileSearch ? 'var(--color-brand-tint)' : 'var(--color-bg)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}
            aria-label="Search"
          >
            🔍
          </button>

          {/* Install App Direct One-Click Action — hidden in PWA standalone mode */}
          {!isPWAStandalone && !isPWAInstalled && (
            <button
              onClick={handleInstallApp}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', border: '1.5px solid var(--color-brand)',
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

          {/* Desktop Nav icons */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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
            >🏠</button>

            {/* Notifications with Dropdown */}
            <div ref={notifMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={handleOpenNotifications}
                style={{
                  position: 'relative', padding: '8px 10px', border: 'none',
                  background: showNotifications ? 'var(--color-brand-tint)' : 'none',
                  cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: 18,
                }}
                title="Notifications"
              >
                🔔
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: '#ef4444', color: 'white',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid white',
                  }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                )}
              </button>
            </div>
          </div>

          {/* User Profile avatar dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: 'none', background: showUserMenu ? 'var(--color-bg)' : 'none',
                cursor: 'pointer', padding: '2px 4px', borderRadius: 'var(--radius-pill)',
              }}
              aria-label="Profile menu"
            >
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} width={34} height={34} className="avatar" unoptimized />
              ) : (
                <div className="avatar" style={{ width: 34, height: 34, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--color-brand)' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
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
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>@{user?.handle}</div>
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push(`/profile?handle=${user?.handle}`); }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                  >
                    👤 View Profile
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/groups'); }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                  >
                    👥 Groups
                  </button>
                  {user?.isAdmin && (
                    <button
                      onClick={() => { setShowUserMenu(false); router.push('/admin/dashboard'); }}
                      style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-ink)', textAlign: 'left' }}
                    >
                      ⚙️ Admin Panel
                    </button>
                  )}
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 0' }} />
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#dc2626', textAlign: 'left', fontWeight: 600 }}
                  >
                    🚪 Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Search Bar Dropdown ─── */}
      {showMobileSearch && (
        <div style={{ padding: '8px 16px 12px', background: 'white', borderTop: '1px solid var(--color-border)' }} className="show-on-mobile">
          <input
            className="input"
            placeholder="Search people..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
            style={{ padding: '8px 14px', fontSize: 14, borderRadius: 'var(--radius-pill)' }}
          />
          {searchQuery.trim().length >= 2 && (
            <div style={{ marginTop: 8, background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              {searchLoading && <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--color-ink-soft)' }}>Searching…</div>}
              {!searchLoading && searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => { setShowMobileSearch(false); goToProfile(res.handle); }}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{res.name} (@{res.handle})</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Row 2: Mobile Navigation Tabs (Facebook Style) ─── */}
      <div
        className="show-on-mobile mobile-top-nav"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderTop: '1px solid var(--color-border)',
          background: 'white',
          height: 48,
        }}
      >
        {/* 1. Home */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            router.push('/feed');
          }}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={pathname === '/feed' ? 'var(--color-brand)' : 'none'} stroke={pathname === '/feed' ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {pathname === '/feed' && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>

        {/* 2. Friends */}
        <button
          onClick={() => router.push('/friends')}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Friends"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={pathname.startsWith('/friends') ? 'var(--color-brand)' : 'none'} stroke={pathname.startsWith('/friends') ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {pathname.startsWith('/friends') && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>

        {/* 3. Messages */}
        <button
          onClick={() => router.push('/messages')}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Messages"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={pathname.startsWith('/messages') ? 'var(--color-brand)' : 'none'} stroke={pathname.startsWith('/messages') ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {unreadMessages > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: '20%',
              background: '#ef4444', color: 'white',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid white',
            }}>{unreadMessages > 9 ? '9+' : unreadMessages}</span>
          )}
          {pathname.startsWith('/messages') && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>

        {/* 4. Study Zone (replaces video icon) */}
        <button
          onClick={() => router.push('/study')}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Study Zone"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={pathname.startsWith('/study') ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {pathname.startsWith('/study') && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>

        {/* 5. Notifications */}
        <button
          onClick={handleOpenNotifications}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Notifications"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={showNotifications ? 'var(--color-brand)' : 'none'} stroke={showNotifications ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadNotifications > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: '20%',
              background: '#ef4444', color: 'white',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid white',
            }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
          )}
          {showNotifications && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>

        {/* 6. Menu (three lines) */}
        <button
          onClick={() => setShowMobileMenu(true)}
          style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={showMobileMenu ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          {showMobileMenu && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, background: 'var(--color-brand)', borderRadius: '99px 99px 0 0' }} />
          )}
        </button>
      </div>

      {/* ─── Notifications Dropdown / Modal ─── */}
      {showNotifications && (
        <div style={{
          position: 'absolute', top: '100%', right: 8, left: 8,
          maxWidth: 400, marginLeft: 'auto',
          background: 'white', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
          zIndex: 400, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'white',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>
              Notifications
              {unreadNotifications > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, background: '#fee2e2', color: '#ef4444', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                  {unreadNotifications} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadNotifications > 0 && (
                <button
                  onClick={handleMarkAllNotifsRead}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontSize: 12, fontWeight: 600 }}
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-ink-soft)' }}
              >×</button>
            </div>
          </div>

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
            {!notificationsLoading && notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center',
                  background: notif.read ? 'white' : 'var(--color-brand-tint)',
                  borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: notif.read ? 500 : 700, fontSize: 13, color: 'var(--color-ink)' }}>{notif.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>{notif.message}</div>
                </div>
                {!notif.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-brand)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Facebook Style Mobile Menu Drawer ─── */}
      {showMobileMenu && (
        <MenuDrawer onClose={() => setShowMobileMenu(false)} />
      )}
    </header>
  );
}
