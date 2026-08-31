'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

// Detect if running as installed PWA
function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsPWA(standalone);
  }, []);
  return isPWA;
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
      // fallback
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
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 99, margin: '0 auto 16px' }} />

        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--color-ink)' }}>Invite Friends</div>
        <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 20 }}>Share Study Partner and start learning together</div>

        {/* Share link bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22, background: 'var(--color-bg)', borderRadius: 12, padding: '10px 14px', alignItems: 'center', border: '1px solid var(--color-border)' }}>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--color-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUrl}</span>
          <button
            onClick={handleCopy}
            style={{ background: copied ? '#22c55e' : 'var(--color-brand)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
          >{copied ? '✓ Copied!' : 'Copy'}</button>
        </div>

        {/* Channel grid */}
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

        {/* Native share button (if available) */}
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

function MenuDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
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
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 999, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Drawer sliding from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 360,
        background: 'var(--color-bg)', zIndex: 1000,
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
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

        {/* User profile row */}
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

        {/* Menu grid - 2 columns like Facebook */}
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
      </div>
      {/* Invite modal rendered on top of the drawer */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  );
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isPWA = useIsPWA();
  const [menuOpen, setMenuOpen] = useState(false);

  // PWA-specific Facebook-like bottom nav tabs
  const pwaTabs = [
    {
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Home',
      href: '/feed',
      match: (p: string) => p === '/feed' || p.startsWith('/feed'),
    },
    {
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Friends',
      href: '/friends',
      match: (p: string) => p.startsWith('/friends'),
    },
    {
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      label: 'Messages',
      href: '/messages',
      match: (p: string) => p.startsWith('/messages'),
    },
    {
      // Study Zone icon instead of Video
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      label: 'Study',
      href: '/study',
      match: (p: string) => p.startsWith('/study'),
    },
    {
      // Three-line menu
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active || menuOpen ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      ),
      label: 'Menu',
      href: '',
      match: (_p: string) => false,
      isMenu: true,
    },
  ];

  // Regular (non-PWA) nav tabs — unchanged
  const regularTabs = [
    {
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Home',
      href: '/feed',
      match: (p: string) => p === '/feed',
      isCenter: false,
    },
    {
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Friends',
      href: '/friends',
      match: (p: string) => p.startsWith('/friends'),
      isCenter: false,
    },
    {
      icon: (_active: boolean) => (
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand), #9F70FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(108,76,250,0.25)',
          marginTop: -16, border: '3px solid white',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
            <rect x="3" y="3" width="8" height="8" rx="2"/>
            <rect x="13" y="3" width="8" height="8" rx="2"/>
            <rect x="3" y="13" width="8" height="8" rx="2"/>
            <rect x="13" y="13" width="8" height="8" rx="2"/>
          </svg>
        </div>
      ),
      label: 'Study Zone',
      href: '/study',
      match: (p: string) => p.startsWith('/study'),
      isCenter: true,
    },
    {
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
      ),
      label: 'Saved',
      href: '/saved',
      match: (p: string) => p.startsWith('/saved'),
      isCenter: false,
    },
    {
      icon: (active: boolean) => (
        user?.avatar ? (
          <div style={{ position: 'relative' }}>
            <Image
              src={user.avatar} alt={user.name} width={28} height={28}
              className="avatar" unoptimized
              style={{ border: active ? '2px solid var(--color-brand)' : '2px solid transparent' }}
            />
          </div>
        ) : (
          <div className="avatar" style={{
            width: 28, height: 28,
            background: active ? 'var(--color-brand)' : 'var(--color-brand-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            color: active ? 'white' : 'var(--color-brand)',
            border: active ? '2px solid var(--color-brand)' : '2px solid transparent',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
        )
      ),
      label: 'Profile',
      href: '/profile',
      match: (p: string) => p.startsWith('/profile'),
      isCenter: false,
      action: () => user && router.push(`/profile?handle=${user.handle}`),
    },
  ];

  if (isPWA) {
    // Facebook-like PWA bottom nav
    return (
      <>
        {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'stretch',
          height: 56, zIndex: 200,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }} className="mobile-bottom-nav">
          {pwaTabs.map(({ icon, label, href, match, isMenu }) => {
            const active = !isMenu && match(pathname);
            return (
              <button
                key={label}
                onClick={() => {
                  if (isMenu) { setMenuOpen(true); return; }
                  router.push(href);
                }}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: '6px 0',
                  position: 'relative',
                }}
                aria-label={label}
              >
                {icon(active || (!!isMenu && menuOpen))}
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-brand)' : (isMenu && menuOpen) ? 'var(--color-brand)' : 'var(--color-ink-faint)',
                  lineHeight: 1,
                }}>{label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 32, height: 2.5, borderRadius: 99,
                    background: 'var(--color-brand)',
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  // Regular browser bottom nav (unchanged)
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--color-border)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 60, zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }} className="mobile-bottom-nav">
      {regularTabs.map(({ icon, label, href, match, isCenter, action }) => {
        const active = match(pathname);
        return (
          <button
            key={label}
            onClick={action || (() => router.push(href))}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: isCenter ? 0 : 3,
              border: 'none', background: 'none', cursor: 'pointer',
              padding: isCenter ? '0 0 8px' : '8px 0',
              position: 'relative',
            }}
            aria-label={label}
          >
            {icon(active)}
            {!isCenter && (
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-brand)' : 'var(--color-ink-faint)',
                lineHeight: 1,
              }}>{label}</span>
            )}
            {!isCenter && active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 2.5, borderRadius: 99,
                background: 'var(--color-brand)',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
