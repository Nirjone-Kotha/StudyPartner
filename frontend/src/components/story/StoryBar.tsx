'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { storyApi, StoryGroup } from '@/lib/storyApi';
import StoryRing from './StoryRing';
import StoryViewer from './StoryViewer';
import StoryComposer from './StoryComposer';

interface StoryBarProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  isAdmin: boolean;
}

export default function StoryBar({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isAdmin,
}: StoryBarProps) {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await storyApi.getFeed();
      setGroups(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [groups]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  };

  const handleDelete = (storyId: string) => {
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, stories: g.stories.filter((s) => s.id !== storyId) }))
        .filter((g) => g.stories.length > 0),
    );
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '12px 16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 120,
                height: 190,
                borderRadius: 14,
                background: 'var(--color-bg)',
                flexShrink: 0,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Story bar container ── */}
      <div
        className="card"
        style={{
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 4,
        }}
      >
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'white',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} color="var(--color-ink)" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '2px 0',
          }}
        >
          {/* ── "Create Story" Facebook-style Card ── */}
          <button
            onClick={() => setComposerOpen(true)}
            style={{
              flexShrink: 0,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div
              className="group"
              style={{
                position: 'relative',
                width: 120,
                height: 190,
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* User avatar top 68% */}
              <div
                style={{
                  height: '68%',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--color-bg)',
                }}
              >
                {currentUserAvatar ? (
                  <img
                    src={currentUserAvatar}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.2s',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #6C4CFA, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              {/* Center Plus Icon Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '68%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--color-brand)',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(108,76,250,0.4)',
                  zIndex: 5,
                }}
              >
                <Plus size={20} color="white" strokeWidth={3} />
              </div>

              {/* Bottom label */}
              <div
                style={{
                  height: '32%',
                  width: '100%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  Create Story
                </span>
              </div>
            </div>
          </button>

          {/* ── Story rings ── */}
          {groups.map((group, idx) => (
            <StoryRing
              key={group.author.id}
              group={group}
              onClick={() => setViewingIndex(idx)}
            />
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'white',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} color="var(--color-ink)" />
          </button>
        )}
      </div>

      {/* ── Story Viewer Modal ── */}
      {viewingIndex !== null && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewingIndex}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onClose={() => setViewingIndex(null)}
          onDelete={handleDelete}
        />
      )}

      {/* ── Story Composer Modal ── */}
      {composerOpen && (
        <StoryComposer
          isAdmin={isAdmin}
          onClose={() => setComposerOpen(false)}
          onCreated={load}
        />
      )}
    </>
  );
}

