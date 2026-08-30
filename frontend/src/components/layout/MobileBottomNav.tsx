'use client';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = [
    {
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Home',
      href: '/feed',
      match: (p: string) => p === '/feed',
    },
    {
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-ink-soft)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Friends',
      href: '/friends',
      match: (p: string) => p.startsWith('/friends'),
    },
    {
      icon: (active: boolean) => (
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand), #9F70FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: active ? '0 4px 14px rgba(108,76,250,0.4)' : '0 2px 8px rgba(108,76,250,0.25)',
          transform: active ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s',
          marginTop: -16,
          border: '3px solid white',
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
    },
    {
      icon: (active: boolean) => (
        user?.avatar ? (
          <div style={{ position: 'relative' }}>
            <Image
              src={user.avatar}
              alt={user.name}
              width={28}
              height={28}
              className="avatar"
              unoptimized
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
      action: () => user && router.push(`/profile?handle=${user.handle}`),
    },
  ];

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
      {tabs.map(({ icon, label, href, match, isCenter, action }) => {
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
