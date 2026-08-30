'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PostCard } from '@/components/feed/PostCard';
import api from '@/lib/api';
import type { Post } from '@/types';

export default function SavedPage() {
  const router = useRouter();
  const { user, hydrate } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!user) return;
    loadSaved();
  }, [user]);// eslint-disable-line

  async function loadSaved() {
    setLoading(true);
    try {
      const { data } = await api.get<Post[]>('/saved');
      setPosts(data);
    } catch {
      toast.error('Could not load saved posts');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) { setPosts(prev => prev.filter(p => p.id !== id)); }
  function handleUpdate(updated: Post) { setPosts(prev => prev.map(p => p.id === updated.id ? updated : p)); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />
      <div className="feed-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="left-sidebar">
          <LeftNav />
        </div>
        <main className="feed-main" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 4 }}>Saved Posts</h1>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>Posts you have saved for later reference</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-ink-faint)' }}>Loading saved posts…</div>
          ) : posts.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>No saved posts yet</p>
              <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 20 }}>Save posts to read or study them later.</p>
              <button className="btn-brand" style={{ padding: '10px 24px' }} onClick={() => router.push('/feed')}>
                Explore Feed
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
          <div className="show-on-mobile" style={{ height: 20 }} />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
