'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Upload, Trash2, ChevronDown, Settings, Check } from 'lucide-react';
import { storyApi, FontStyle, FontSize, CreateStoryPayload } from '@/lib/storyApi';
import { useAuth } from '@/hooks/useAuth';

interface StoryComposerProps {
  isAdmin: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const BG_GRADIENTS = [
  { id: 'blue', name: 'Classic Blue', bg: 'linear-gradient(135deg, #0064e0 0%, #0084ff 50%, #00c6ff 100%)', color: '#0084ff' },
  { id: 'purple-pink', name: 'Berry', bg: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)', color: '#ec4899' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)', color: '#f97316' },
  { id: 'coral', name: 'Coral', bg: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', color: '#ff416c' },
  { id: 'navy', name: 'Deep Sea', bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', color: '#203a43' },
  { id: 'dark', name: 'Midnight', bg: 'linear-gradient(135deg, #18191a 0%, #242526 100%)', color: '#18191a' },
  { id: 'aurora', name: 'Neon Aurora', bg: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#00f2fe' },
  { id: 'emerald', name: 'Emerald', bg: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', color: '#0ba360' },
  { id: 'golden', name: 'Sunburst', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#f6d365' },
  { id: 'violet', name: 'Lavender', bg: 'linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)', color: '#8a2387' },
  { id: 'cotton', name: 'Pastel Dream', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', color: '#a18cd1' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', color: '#134e5e' },
];

const FONT_STYLES: { id: FontStyle; label: string; name: string }[] = [
  { id: 'normal', label: 'Aa Clean', name: 'Clean' },
  { id: 'bold', label: 'Aa Headline', name: 'Headline' },
  { id: 'italic', label: 'Aa Casual', name: 'Casual' },
  { id: 'bolditalic', label: 'Aa Fancy', name: 'Fancy' },
];

const FONT_SIZES: { label: string; value: FontSize }[] = [
  { label: 'S',  value: 'small' },
  { label: 'M',  value: 'medium' },
  { label: 'L',  value: 'large' },
  { label: 'XL', value: 'xlarge' },
];

const TEXT_COLORS = [
  { name: 'White', color: '#ffffff' },
  { name: 'Black', color: '#000000' },
  { name: 'Gold', color: '#fef08a' },
  { name: 'Sky', color: '#bae6fd' },
  { name: 'Mint', color: '#bbf7d0' },
  { name: 'Rose', color: '#fecdd3' },
];

const MAX_CHARS = 300;

export default function StoryComposer({ isAdmin, onClose, onCreated }: StoryComposerProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_GRADIENTS[0].bg);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState<FontStyle>('normal');
  const [fontSize, setFontSize] = useState<FontSize>('large');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Track mobile vs desktop via JS (reliable in portals where CSS classes may be overridden)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const previewFontClass: Record<FontSize, string> = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xlarge: 'text-3xl',
  };

  const previewFontStyle: React.CSSProperties = {
    fontWeight: fontStyle.includes('bold') ? 800 : 500,
    fontStyle: fontStyle.includes('italic') ? 'italic' : 'normal',
    fontFamily: fontStyle === 'italic' || fontStyle === 'bolditalic' ? 'cursive, sans-serif' : 'inherit',
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageUrl) {
      setError('Please write something for your story.');
      return;
    }
    setError('');
    setLoading(true);

    const payload: CreateStoryPayload = {
      textContent: text.trim() || ' ',
      bgColor,
      textColor,
      fontStyle,
      fontSize,
    };
    if (imageUrl) payload.imageUrl = imageUrl;

    try {
      await storyApi.create(payload);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create story.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: '#f0f2f5',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
      overflow: 'hidden',
    }}>
      {/* ══════════════════════════════════════════════════════════
          MOBILE / PWA VIEW (Matching Facebook Mobile App Image)
         ══════════════════════════════════════════════════════════ */}
      {isMobile && (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: bgColor,
          zIndex: 100001,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        {/* Optional Uploaded Photo Background on Mobile */}
        {imageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          </>
        )}

        {/* Top bar on Mobile */}
        <div style={{
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(4px)',
            }}
            title="Close"
          >
            <X size={22} />
          </button>

          {isAdmin && (
            <div>
              <input
                ref={mobileFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => mobileFileInputRef.current?.click()}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                  background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Upload size={14} />
                Photo
              </button>
            </div>
          )}
        </div>

        {/* Center: Tap-to-type Story Text directly on canvas */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 20px', zIndex: 10,
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Start typing..."
            rows={5}
            style={{
              width: '100%', maxWidth: 360,
              background: 'transparent', border: 'none',
              outline: 'none', resize: 'none',
              textAlign: 'center',
              color: textColor,
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
              fontSize: fontSize === 'small' ? 18 : fontSize === 'medium' ? 22 : fontSize === 'large' ? 26 : 32,
              lineHeight: 1.35,
              ...previewFontStyle,
            }}
            autoFocus
          />
        </div>

        {/* Bottom Bar: Settings Icon (Left) + Share now Button (Right) */}
        <div style={{
          padding: '16px 20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          {/* Settings gear icon on bottom left */}
          <button
            onClick={() => setShowMobileSettings(true)}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            title="Story Settings"
          >
            <Settings size={22} />
          </button>

          {/* Share now pill button on bottom right */}
          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !imageUrl)}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#050505',
              border: 'none', fontWeight: 800, fontSize: 15,
              cursor: loading || (!text.trim() && !imageUrl) ? 'default' : 'pointer',
              opacity: loading || (!text.trim() && !imageUrl) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            {loading ? 'Sharing…' : 'Share now ➤'}
          </button>
        </div>

        {/* ── Mobile Settings Bottom Sheet Drawer ── */}
        {showMobileSettings && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 100005,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowMobileSettings(false); }}
          >
            <div style={{
              width: '100%', background: 'white',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 32px',
              maxHeight: '80vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 18,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
            }}>
              {/* Drawer Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#050505', margin: 0 }}>
                  Story Settings
                </h3>
                <button
                  onClick={() => setShowMobileSettings(false)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                    background: '#0084FF', color: 'white',
                    border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>

              {/* 1. Background Gradients */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#65676b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Background Colors
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10,
                }}>
                  {BG_GRADIENTS.map((g) => {
                    const isSelected = bgColor === g.bg;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setBgColor(g.bg)}
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: g.bg,
                          border: isSelected ? '3px solid #0084FF' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px white, 0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer', transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        {isSelected && <Check size={18} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Text Font (Typeface) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#65676b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Text Font
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {FONT_STYLES.map((fs) => {
                    const isSelected = fontStyle === fs.id;
                    return (
                      <button
                        key={fs.id}
                        type="button"
                        onClick={() => setFontStyle(fs.id)}
                        style={{
                          padding: '10px 14px', borderRadius: 10,
                          border: isSelected ? '2px solid #0084FF' : '1px solid #ced0d4',
                          background: isSelected ? '#eff6ff' : 'white',
                          color: isSelected ? '#0084FF' : '#050505',
                          fontWeight: 700, fontSize: 14, cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {fs.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Font Size */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#65676b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Font Size
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FONT_SIZES.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFontSize(value)}
                      style={{
                        flex: 1, height: 40, borderRadius: 10,
                        border: fontSize === value ? '2px solid #0084FF' : '1px solid #ced0d4',
                        background: fontSize === value ? '#eff6ff' : 'white',
                        color: fontSize === value ? '#0084FF' : '#050505',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Text Color */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#65676b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Text Color
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {TEXT_COLORS.map((c) => {
                    const isSelected = textColor === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setTextColor(c.color)}
                        style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: c.color,
                          border: c.color === '#ffffff' ? '1px solid #ced0d4' : 'none',
                          outline: isSelected ? '3px solid #0084FF' : 'none',
                          outlineOffset: 2,
                          cursor: 'pointer',
                        }}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Admin Photo Upload if Admin */}
              {isAdmin && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#65676b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Photo Background (Admin)
                  </div>
                  {imageUrl ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10, background: '#f0f2f5',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#050505', flex: 1 }}>Photo Attached</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => mobileFileInputRef.current?.click()}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 10,
                        border: '1.5px dashed #ced0d4', background: '#fafafa',
                        fontSize: 13, fontWeight: 600, color: '#050505',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <Upload size={16} color="#0084FF" />
                      Add Photo from Device
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
      {/* ══════════════════════════════════════════════════════════
          DESKTOP VIEW (Facebook Story Studio with Left Panel & Dark Theater)
         ══════════════════════════════════════════════════════════ */}
      {!isMobile && (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* ─── Facebook Story Topbar ─── */}
        <header style={{
          height: 56, background: 'white',
          borderBottom: '1px solid #e4e6eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#e4e6eb', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#050505', transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#d8dadf')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#e4e6eb')}
              title="Close"
            >
              <X size={20} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#050505' }}>
              Story Studio
            </span>
          </div>
        </header>

        {/* ─── Main Content: Left Controls + Right Preview (Facebook Style) ─── */}
        <div style={{
          flex: 1, display: 'flex', minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* ── Left Sidebar Panel (Facebook Controls) ── */}
          <div style={{
            width: 360, flexShrink: 0, background: 'white',
            borderRight: '1px solid #e4e6eb',
            display: 'flex', flexDirection: 'column',
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            zIndex: 10,
          }}
          className="w-full md:w-90 flex flex-col"
          >
            {/* Header row */}
            <div style={{
              padding: '16px 20px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid #f0f2f5',
            }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#050505', margin: 0 }}>
                Your story
              </h1>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#65676b',
              }}>
                <Settings size={18} />
              </div>
            </div>

            {/* Controls Body (Scrollable) */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px 24px',
              display: 'flex', flexDirection: 'column', gap: 16,
              WebkitOverflowScrolling: 'touch',
            }}>
              {/* User row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || 'User'}
                    width={44} height={44}
                    className="avatar" unoptimized
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--color-brand-tint)', color: 'var(--color-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18,
                  }}>
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#050505' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 12, color: '#65676b' }}>
                    Public Story 🌐
                  </div>
                </div>
              </div>

              {/* Start typing Textarea */}
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Start typing..."
                  rows={4}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 10, border: '1.5px solid #ced0d4',
                    fontSize: 15, color: '#050505', background: 'transparent',
                    outline: 'none', resize: 'none', lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0084FF')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#ced0d4')}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: text.length >= MAX_CHARS ? '#ef4444' : '#8a8d91' }}>
                    {text.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Typeface Dropdown (Facebook Style: Aa Clean) */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowFontDropdown(v => !v)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    borderRadius: 10, border: '1.5px solid #ced0d4',
                    background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 15, fontWeight: 600, color: '#050505',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#65676b' }}>Aa</span>
                    <span>{FONT_STYLES.find(f => f.id === fontStyle)?.name || 'Clean'}</span>
                  </div>
                  <ChevronDown size={18} style={{ color: '#65676b', transform: showFontDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {showFontDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'white', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: '1px solid #e4e6eb', zIndex: 50,
                    overflow: 'hidden', padding: 6,
                  }}>
                    {FONT_STYLES.map((fs) => (
                      <button
                        key={fs.id}
                        type="button"
                        onClick={() => { setFontStyle(fs.id); setShowFontDropdown(false); }}
                        style={{
                          width: '100%', padding: '10px 14px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          border: 'none', background: fontStyle === fs.id ? '#f0f2f5' : 'transparent',
                          borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          fontSize: 14, fontWeight: fontStyle === fs.id ? 700 : 500,
                          color: fontStyle === fs.id ? '#0084FF' : '#050505',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#f2f3f5')}
                        onMouseOut={(e) => (e.currentTarget.style.background = fontStyle === fs.id ? '#f0f2f5' : 'transparent')}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{fs.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Size Selector */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#65676b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Font Size
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FONT_SIZES.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFontSize(value)}
                      style={{
                        flex: 1, height: 38, borderRadius: 8,
                        border: fontSize === value ? '2px solid #0084FF' : '1px solid #ced0d4',
                        background: fontSize === value ? '#eff6ff' : 'white',
                        color: fontSize === value ? '#0084FF' : '#050505',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backgrounds Section (Facebook Style Circle Swatches) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#050505' }}>Backgrounds</span>
                </div>
                <div style={{ fontSize: 12, color: '#65676b', marginBottom: 10 }}>Gradient</div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10,
                }}>
                  {BG_GRADIENTS.map((g) => {
                    const isSelected = bgColor === g.bg;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setBgColor(g.bg)}
                        style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: g.bg,
                          border: isSelected ? '3px solid #0084FF' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px white, 0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer', transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.15s, border-color 0.15s',
                        }}
                        title={g.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Text Color Selector */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#65676b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Text Color
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {TEXT_COLORS.map((c) => {
                    const isSelected = textColor === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setTextColor(c.color)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: c.color,
                          border: c.color === '#ffffff' ? '1px solid #ced0d4' : 'none',
                          outline: isSelected ? '2px solid #0084FF' : 'none',
                          outlineOffset: 2,
                          cursor: 'pointer',
                        }}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Error Banner if any */}

              {error && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Bottom Action Buttons (Discard + Share to story) */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #e4e6eb',
              background: 'white', display: 'flex', gap: 12,
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: '#e4e6eb', color: '#050505',
                  border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#d8dadf')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#e4e6eb')}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (!text.trim() && !imageUrl)}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 8,
                  background: '#0084FF', color: 'white',
                  border: 'none', fontWeight: 700, fontSize: 14,
                  cursor: loading || (!text.trim() && !imageUrl) ? 'default' : 'pointer',
                  opacity: loading || (!text.trim() && !imageUrl) ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(0, 132, 255, 0.3)',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => { if (!loading && (text.trim() || imageUrl)) e.currentTarget.style.background = '#0073e6'; }}
                onMouseOut={(e) => { if (!loading && (text.trim() || imageUrl)) e.currentTarget.style.background = '#0084FF'; }}
              >
                {loading ? 'Sharing…' : 'Share to story'}
              </button>
            </div>
          </div>

          {/* ── Right Main Canvas (Facebook Dark Theater Preview) ── */}
          <div style={{
            flex: 1, background: '#18191a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, position: 'relative', overflow: 'hidden',
          }}
          className="hidden md:flex flex-1"
          >
            {/* 9:16 Vertical Story Card Preview */}
            <div style={{
              width: 340, height: 600, borderRadius: 16,
              background: bgColor, position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px 20px', transition: 'background 0.3s ease',
            }}>
              {/* Optional Background Photo */}
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                </>
              )}

              {/* Story Top Progress Bar */}
              <div style={{
                position: 'absolute', top: 14, left: 14, right: 14,
                height: 3, background: 'rgba(255,255,255,0.35)', borderRadius: 99,
                overflow: 'hidden', zIndex: 10,
              }}>
                <div style={{ width: '40%', height: '100%', background: 'white' }} />
              </div>

              {/* Story Header Inside Card */}
              <div style={{
                position: 'absolute', top: 26, left: 14, right: 14,
                display: 'flex', alignItems: 'center', gap: 10, zIndex: 10,
              }}>
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || 'User'}
                    width={36} height={36}
                    className="avatar" unoptimized
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid white' }}
                  />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'white', color: '#0084FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {user?.name || 'User'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    Just now
                  </span>
                </div>
              </div>

              {/* Dynamic Centered Text */}
              <p
                className={`relative text-center leading-snug wrap-break-word z-10 ${previewFontClass[fontSize]}`}
                style={{
                  color: textColor,
                  textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                  margin: 0, maxWidth: '90%',
                  ...previewFontStyle,
                }}
              >
                {text || 'Start typing…'}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>,
    document.body
  );
}
