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

function MenuDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();

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
      action: () => {
        if (navigator.share) {
          navigator.share({ title: 'Study Partner', url: window.location.origin });
        }
        onClose();
      },
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
