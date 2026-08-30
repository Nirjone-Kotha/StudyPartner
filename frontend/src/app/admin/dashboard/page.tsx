'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { AdminStats, Post, User, Report } from '@/types';

type Panel = 'overview' | 'posts' | 'users' | 'reports' | 'studio';

function StatCard({ value, label, icon, color }: { value: number | string; label: string; icon: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      display: 'flex',
      gap: 14,
      alignItems: 'center',
    }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, hydrate, clearAuth } = useAuth();
  const [panel, setPanel] = useState<Panel>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [studioText, setStudioText] = useState('');
  const [studioImg, setStudioImg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!user) { router.replace('/admin/login'); return; }
    if (!user.isAdmin) { router.replace('/feed'); return; }
    loadStats();
  }, [user]); // eslint-disable-line

  async function loadStats() {
    try {
      const { data } = await api.get<AdminStats>('/admin/stats');
      setStats(data);
    } catch { router.replace('/admin/login'); }
  }

  async function loadPosts() {
    const { data } = await api.get<Post[]>('/admin/posts');
    setPosts(data);
  }

  async function loadUsers() {
    const { data } = await api.get<User[]>('/admin/users');
    setUsers(data);
  }

  async function loadReports() {
    const { data } = await api.get<Report[]>('/admin/reports');
    setReports(data);
  }

  async function switchPanel(p: Panel) {
    setPanel(p);
    if (p === 'posts' && posts.length === 0) loadPosts();
    if (p === 'users' && users.length === 0) loadUsers();
    if (p === 'reports' && reports.length === 0) loadReports();
  }

  async function toggleFeatured(id: string) {
    await api.patch(`/admin/posts/${id}/feature`);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
    toast.success('Updated!');
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/admin/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
    if (stats) setStats(s => s ? { ...s, totalPosts: s.totalPosts - 1 } : s);
    toast.success('Deleted');
  }

  async function updateReport(id: string, status: 'REVIEWED' | 'DISMISSED') {
    await api.patch(`/admin/reports/${id}`, { status });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Report updated');
  }

  async function publishStudio(e: React.FormEvent) {
    e.preventDefault();
    if (!studioText.trim()) return;
    setLoading(true);
    try {
      await api.post('/admin/studio/publish', {
        text: studioText.trim(),
        mediaUrl: studioImg.trim() || undefined,
        mediaType: studioImg.trim() ? 'IMAGE' : undefined,
      });
      toast.success('Published to feed! 🎉');
      setStudioText(''); setStudioImg('');
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  }

  const NAV: { id: Panel; icon: string; label: string }[] = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'posts', icon: '📝', label: 'Posts' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'reports', icon: '🚩', label: 'Reports' },
    { id: 'studio', icon: '✨', label: 'Content Studio' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1C1830', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-right" />

      {/* Admin topbar */}
      <header style={{
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'white' }}>Study Partner Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => router.push('/feed')} style={{ fontSize: 13, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            ← Back to site
          </button>
          <button
            onClick={() => { clearAuth(); router.push('/'); }}
            style={{ fontSize: 13, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.08)', padding: '24px 12px', flexShrink: 0 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => switchPanel(n.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: panel === n.id ? 'rgba(108,76,250,0.2)' : 'transparent',
                color: panel === n.id ? 'var(--color-brand)' : 'rgba(255,255,255,0.5)',
                fontWeight: panel === n.id ? 700 : 400,
                fontSize: 14,
                textAlign: 'left',
                transition: 'all 0.15s',
                marginBottom: 2,
              }}
            >
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>

          {panel === 'overview' && stats && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 24 }}>
                Dashboard Overview
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <StatCard value={stats.totalUsers} label="Total Users" icon="👥" color="var(--color-brand)" />
                <StatCard value={stats.totalPosts} label="Total Posts" icon="📝" color="#22c55e" />
                <StatCard value={stats.featuredPosts} label="Featured" icon="⭐" color="var(--color-gold)" />
                <StatCard value={stats.openReports} label="Open Reports" icon="🚩" color="var(--color-accent)" />
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>Recent Posts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.recentPosts.map((p: any) => (
                  <div key={p.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{p.text?.slice(0, 60) || '[Poll/Media]'}…</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>by {p.user?.name} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
                    </div>
                    {p.featured && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,201,60,0.2)', color: 'var(--color-gold)', fontWeight: 700 }}>Featured</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === 'posts' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 24 }}>
                Manage Posts ({posts.length})
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {posts.map((p) => (
                  <div key={p.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${p.featured ? 'rgba(108,76,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.text?.slice(0, 80) || `[${p.type}]`}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        @{p.user?.handle} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleFeatured(p.id)}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: p.featured ? 'rgba(255,201,60,0.2)' : 'rgba(255,255,255,0.08)', color: p.featured ? 'var(--color-gold)' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}
                      >
                        {p.featured ? '⭐ Unfeature' : '☆ Feature'}
                      </button>
                      <button
                        onClick={() => deletePost(p.id)}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: 'rgba(255,107,74,0.15)', color: 'var(--color-accent)', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === 'users' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 24 }}>
                Users ({users.length})
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {users.map((u) => (
                  <div key={u.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}>
                    <img src={u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.handle}`} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{u.name}</span>
                        {u.isAdmin && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-pill)', background: 'rgba(108,76,250,0.25)', color: 'var(--color-brand)', fontWeight: 700 }}>Admin</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>@{u.handle} · {(u._count as any)?.posts ?? 0} posts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === 'reports' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 24 }}>
                Reports ({reports.filter(r => r.status === 'PENDING').length} pending)
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map((r) => (
                  <div key={r.id} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${r.status === 'PENDING' ? 'rgba(255,107,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
                          🚩 {r.reason}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                          by @{r.user.handle} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                          Post: "{r.post.text?.slice(0, 50)}"
                        </p>
                      </div>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 700,
                        background: r.status === 'PENDING' ? 'rgba(255,107,74,0.2)' : r.status === 'REVIEWED' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                        color: r.status === 'PENDING' ? 'var(--color-accent)' : r.status === 'REVIEWED' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      }}>
                        {r.status}
                      </span>
                    </div>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => updateReport(r.id, 'REVIEWED')} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600 }}>
                          ✓ Mark Reviewed
                        </button>
                        <button onClick={() => updateReport(r.id, 'DISMISSED')} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {reports.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>No reports yet 🎉</p>
                )}
              </div>
            </div>
          )}

          {panel === 'studio' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                Content Studio
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
                Publish featured content directly to the feed as Study Partner Team
              </p>
              <div style={{ maxWidth: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 28 }}>
                <form onSubmit={publishStudio} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Post Content *
                    </label>
                    <textarea
                      className="input"
                      placeholder="Write your featured announcement or content…"
                      value={studioText}
                      onChange={(e) => setStudioText(e.target.value)}
                      required
                      rows={5}
                      style={{ resize: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Attach Photo (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onload = () => setStudioImg(r.result as string);
                          r.readAsDataURL(file);
                        }
                      }}
                      style={{ color: 'white', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, padding: '14px', background: 'rgba(108,76,250,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(108,76,250,0.2)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      This post will be published as <strong style={{ color: 'var(--color-brand)' }}>Study Partner Team</strong> and marked as <strong style={{ color: 'var(--color-gold)' }}>Featured</strong>.
                    </p>
                  </div>
                  <button type="submit" className="btn-brand" disabled={loading} style={{ alignSelf: 'flex-end', padding: '11px 28px' }}>
                    {loading ? 'Publishing…' : 'Publish to Feed'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
