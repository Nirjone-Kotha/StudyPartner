'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Story, StoryGroup, storyApi } from '@/lib/storyApi';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onDelete?: (storyId: string) => void;
}

const FONT_SIZE_MAP: Record<string, string> = {
  small:  'text-lg sm:text-xl',
  medium: 'text-xl sm:text-2xl',
  large:  'text-2xl sm:text-3xl',
  xlarge: 'text-3xl sm:text-4xl',
};

const FONT_STYLE_MAP: Record<string, React.CSSProperties> = {
  normal:     { fontWeight: 400, fontStyle: 'normal' },
  italic:     { fontWeight: 400, fontStyle: 'italic' },
  bold:       { fontWeight: 700, fontStyle: 'normal' },
  bolditalic: { fontWeight: 700, fontStyle: 'italic' },
};

const STORY_DURATION = 5000; // ms per story slide

export default function StoryViewer({
  groups,
  initialGroupIndex,
  currentUserId,
  isAdmin,
  onClose,
  onDelete,
}: StoryViewerProps) {
  const [groupIdx, setGroupIdx]   = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [paused, setPaused]       = useState(false);
  const intervalRef               = useRef<NodeJS.Timeout | null>(null);
  const progressRef               = useRef<NodeJS.Timeout | null>(null);

  const group   = groups[groupIdx];
  const story   = group?.stories[storyIdx];
  const isOwner = story?.authorId === currentUserId;

  // ─── Mark as viewed ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!story || story.viewed) return;
    storyApi.markViewed(story.id).catch(() => {});
  }, [story?.id]);

  // ─── Auto-progress ────────────────────────────────────────────────────────

  const clearTimers = () => {
    if (intervalRef.current)  clearTimeout(intervalRef.current);
    if (progressRef.current)  clearInterval(progressRef.current);
  };

  const advance = useCallback(() => {
    setProgress(0);
    const hasNextStory = storyIdx < group.stories.length - 1;
    const hasNextGroup = groupIdx < groups.length - 1;

    if (hasNextStory) {
      setStoryIdx((i) => i + 1);
    } else if (hasNextGroup) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, group, groups, onClose]);

  useEffect(() => {
    if (paused) return;
    clearTimers();
    setProgress(0);

    // Smooth progress bar
    const step = 100 / (STORY_DURATION / 50);
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + step, 100));
    }, 50);

    intervalRef.current = setTimeout(advance, STORY_DURATION);

    return clearTimers;
  }, [storyIdx, groupIdx, paused, advance]);

  // ─── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance();
      if (e.key === 'ArrowLeft')  goBack();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, onClose]);

  const goBack = () => {
    setProgress(0);
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    await storyApi.delete(story.id);
    onDelete?.(story.id);
    advance();
  };

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Story card — max phone-screen width */}
      <div
        className="relative w-full max-w-sm h-full md:h-[90vh] md:max-h-187.5 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        style={{ background: story.bgColor }}
      >
        {/* Admin image */}
        {story.imageUrl && (
          <img
            src={story.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

        {/* ── Top Header: Progress bars & Author info ── */}
        <div className="relative z-20 p-4 pt-3 space-y-3">
          {/* Progress bars */}
          <div className="flex gap-1.5">
            {group.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-0.75 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width:
                      i < storyIdx ? '100%' :
                      i === storyIdx ? `${progress}%` :
                      '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shrink-0 shadow-sm">
              {group.author.avatar ? (
                <img src={group.author.avatar} alt={group.author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {group.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight truncate flex items-center gap-1.5">
                {group.author.name}
                {group.author.isAdmin && (
                  <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-extrabold tracking-wide">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-white/80 text-xs mt-0.5">
                {timeAgo(story.createdAt)}
              </p>
            </div>

            {/* View count (owner or admin) */}
            {(isOwner || isAdmin) && (
              <div className="flex items-center gap-1 text-white/90 text-xs px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                <Eye size={13} />
                <span className="font-semibold">{story.viewCount ?? 0}</span>
              </div>
            )}

            {/* Delete button */}
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-black/30 text-white hover:bg-red-500/80 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/30 text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Story text (Centered, No Scrollbar needed) ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-6 select-none">
          <p
            className={`
              text-center leading-relaxed wrap-break-word w-full max-h-120 overflow-hidden
              ${FONT_SIZE_MAP[story.fontSize] ?? 'text-2xl'}
            `}
            style={{
              color:      story.textColor,
              textShadow: '0 2px 10px rgba(0,0,0,0.65)',
              ...FONT_STYLE_MAP[story.fontStyle],
            }}
          >
            {story.textContent}
          </p>
        </div>

        <div className="relative z-20 h-6" />

        {/* ── Left / Right tap zones ── */}
        <button
          className="absolute left-0 top-16 w-1/3 bottom-16 z-30 focus:outline-none cursor-pointer"
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          aria-label="Previous story"
          style={{ background: 'transparent', border: 'none' }}
        />
        <button
          className="absolute right-0 top-16 w-2/3 bottom-16 z-30 focus:outline-none cursor-pointer"
          onClick={(e) => { e.stopPropagation(); advance(); }}
          aria-label="Next story"
          style={{ background: 'transparent', border: 'none' }}
        />
      </div>

      {/* Side navigation arrows (desktop) */}
      {groupIdx > 0 && (
        <button
          onClick={() => { setGroupIdx((g) => g - 1); setStoryIdx(0); setProgress(0); }}
          className="hidden md:flex absolute left-6 p-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all transform hover:scale-110"
          aria-label="Previous user"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {groupIdx < groups.length - 1 && (
        <button
          onClick={() => { setGroupIdx((g) => g + 1); setStoryIdx(0); setProgress(0); }}
          className="hidden md:flex absolute right-6 p-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all transform hover:scale-110"
          aria-label="Next user"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

