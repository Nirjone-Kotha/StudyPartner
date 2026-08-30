'use client';

import React from 'react';
import { StoryGroup } from '@/lib/storyApi';

interface StoryRingProps {
  group: StoryGroup;
  onClick: () => void;
}

/** Font-size map for thumbnail preview */
const FONT_PREVIEW: Record<string, string> = {
  small:  '10px',
  medium: '12px',
  large:  '14px',
  xlarge: '16px',
};

const FONT_STYLE_MAP: Record<string, React.CSSProperties> = {
  normal:     { fontWeight: 400, fontStyle: 'normal' },
  italic:     { fontWeight: 400, fontStyle: 'italic' },
  bold:       { fontWeight: 700, fontStyle: 'normal' },
  bolditalic: { fontWeight: 700, fontStyle: 'italic' },
};

export default function StoryRing({ group, onClick }: StoryRingProps) {
  const { author, stories } = group;
  const firstStory = stories[0];
  const allViewed = stories.every((s) => s.viewed);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group"
      aria-label={`${author.name}'s story`}
      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
    >
      {/* Thumbnail card */}
      <div
        className={`
          relative rounded-2xl overflow-hidden cursor-pointer
          shadow-md transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-lg
          ${allViewed ? 'ring-2 ring-gray-300' : 'ring-2 ring-offset-2 ring-indigo-500'}
        `}
        style={{
          background: firstStory?.bgColor || '#6366f1',
          width: 120,
          height: 190,
          borderRadius: 14,
          position: 'relative',
        }}
      >
        {/* Admin image background */}
        {firstStory?.imageUrl && (
          <img
            src={firstStory.imageUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
        )}

        {/* Text preview */}
        <div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 10px 48px' }}
        >
          <p
            style={{
              color:      firstStory?.textColor || '#ffffff',
              fontSize:   FONT_PREVIEW[firstStory?.fontSize] ?? '13px',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              ...FONT_STYLE_MAP[firstStory?.fontStyle || 'normal'],
            }}
          >
            {firstStory?.textContent}
          </p>
        </div>

        {/* Author avatar and name — Facebook style */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '24px 8px 8px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: allViewed ? '2px solid #d1d5db' : '2px solid #6366f1',
              overflow: 'hidden', marginBottom: 4,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 700,
              }}>
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p style={{
            color: 'white', fontSize: 11, fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}>
            {author.name}
          </p>
        </div>

        {/* Unread blue dot */}
        {!allViewed && (
          <span
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 10, height: 10,
              background: '#3b82f6', borderRadius: '50%',
              border: '2px solid white',
            }}
          />
        )}
      </div>
    </button>
  );
}

