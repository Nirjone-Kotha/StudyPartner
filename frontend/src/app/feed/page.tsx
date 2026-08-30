'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { RightColumn } from '@/components/layout/RightColumn';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Composer } from '@/components/feed/Composer';
import { PostCard } from '@/components/feed/PostCard';
import { StoryBar } from '@/components/story';
import api from '@/lib/api';
import type { Post, FeedResponse } from '@/types';

export default function FeedPage() {
  const router = useRouter();
  const { user, isHydrated, hydrate } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/');
    }
  }, [isHydrated, user, router]);

  const loadFeed = useCallback(async (pg: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get<FeedResponse>(`/posts/feed?page=${pg}&limit=20`);
      if (data && Array.isArray(data.posts)) {
        if (pg === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.posts.length === 20);
        setPage(pg);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      loadFeed(1);
    }
  }, [isHydrated, user, loadFeed]);

  // Handle Home button refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadFeed(1);
    };
    window.addEventListener('refresh-feed', handleRefresh);
    return () => window.removeEventListener('refresh-feed', handleRefresh);
  }, [loadFeed]);

  function handleNewPost(post: Post) { setPosts(prev => [post, ...prev]); }
  function handleDelete(id: string) { setPosts(prev => prev.filter(p => p.id !== id)); }
  function handleUpdate(updated: Post) { setPosts(prev => prev.map(p => p.id === updated.id ? updated : p)); }
  function loadMore() { if (!loading && hasMore) loadFeed(page + 1); }

  if (initialLoad) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 16 }}>Loading feed…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />
      <div
        className="feed-layout"
        style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '24px',
          display: 'flex', gap: 24, alignItems: 'flex-start',
        }}
      >
        <div className="left-sidebar">
          <LeftNav />
        </div>

        {/* Main feed */}
        <main className="feed-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. Composer on top (Facebook style) */}
          <Composer onPost={handleNewPost} />

          {/* 2. Story bar underneath Composer */}
          {user && (
            <StoryBar
              currentUserId={user.id}
              currentUserName={user.name}
              currentUserAvatar={user.avatar}
              isAdmin={!!user.isAdmin}
            />
          )}

          {posts.length === 0 && !loading && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--color-ink-soft)', fontSize: 16 }}>No posts yet. Be the first to share!</p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}

          {hasMore && !loading && posts.length > 0 && (
            <button onClick={loadMore} className="btn-ghost" style={{ width: '100%', padding: '14px', fontSize: 14 }}>
              Load More Posts
            </button>
          )}

          {loading && !initialLoad && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-ink-faint)' }}>
              Loading more…
            </div>
          )}

          {/* Bottom padding for mobile nav */}
          <div className="show-on-mobile" style={{ height: 20 }} />
        </main>

        <div className="right-sidebar">
          <RightColumn />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
