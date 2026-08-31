'use client';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { icon: '👤', label: 'Profile',    href: '/profile',  blur: false },
  { icon: '🏠', label: 'Home',       href: '/feed',     blur: false },
  { icon: '👥', label: 'Friends',    href: '/friends',  blur: false },
  { icon: '🎓', label: 'Groups',     href: '/groups',   blur: false },
  { icon: '💬', label: 'Messages',   href: '/messages', blur: false },
  { icon: '📚', label: 'Study Zone', href: '/study',    blur: false },
  { icon: '🔖', label: 'Saved',      href: '/saved',    blur: false },
];

export function LeftNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  function handleNavClick(href: string, blur: boolean) {
    if (blur) return;
    if (href === '/profile' && user) {
      router.push(`/profile?handle=${user.handle}`);
    } else {
      router.push(href);
    }
  }

  return (
    <aside style={{ width: '100%' }}>
      {/* User card */}
      {user && (
        <div
          className="card"
          style={{ padding: '16px', marginBottom: 8, cursor: 'pointer' }}
          onClick={() => router.push(`/profile?handle=${user.handle}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} width={44} height={44} className="avatar" unoptimized />
            ) : (
              <div className="avatar" style={{ width: 44, height: 44, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--color-brand)' }}>
                {user.name[0]}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>@{user.handle}</div>
              {user.isAdmin && (
                <span className="badge badge-brand" style={{ fontSize: 10, marginTop: 2 }}>⚡ Admin</span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-soft)', fontSize: 13, fontWeight: 600 }}>
            <span style={{ fontSize: 14 }}>👥</span>
            <span>{user.followersCount ?? 0} Followers</span>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ icon, label, href, blur }) => {
          const isActive = !blur && (
            href === '/profile'
              ? pathname.startsWith('/profile')
              : pathname === href || pathname.startsWith(href + '/')
          );

          return (
            <button
              key={label}
              onClick={() => handleNavClick(href, blur)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: blur ? 'not-allowed' : 'pointer',
                background: isActive ? 'var(--color-brand-tint)' : 'transparent',
                color: isActive ? 'var(--color-brand)' : 'var(--color-ink-soft)',
                fontWeight: isActive ? 700 : 500, fontSize: 14, textAlign: 'left',
                transition: 'all 0.15s',
                opacity: blur ? 0.45 : 1,
                filter: blur ? 'blur(0.5px)' : 'none',
              }}
              onMouseOver={(e) => {
                if (!isActive && !blur) e.currentTarget.style.background = 'var(--color-bg)';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              title={blur ? 'Coming soon' : label}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
              {blur && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--color-ink-faint)', color: 'white', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}

        {/* Admin panel link */}
        {user?.isAdmin && (
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: pathname.startsWith('/admin') ? 'var(--color-accent-tint)' : 'transparent',
              color: pathname.startsWith('/admin') ? 'var(--color-accent)' : 'var(--color-ink-soft)',
              fontWeight: 600, fontSize: 14, textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>⚙️</span>
            Admin Panel
          </button>
        )}
      </nav>
    </aside>
  );
}
