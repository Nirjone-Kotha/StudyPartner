'use client';

import React, { useState, useRef } from 'react';
import { X, Type, Palette, Upload, Trash2 } from 'lucide-react';
import { storyApi, FontStyle, FontSize, CreateStoryPayload } from '@/lib/storyApi';

interface StoryComposerProps {
  isAdmin: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const BG_PALETTES = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#1e293b', // dark slate
  '#7c3aed', // purple
  '#be185d', // deep pink
];

const TEXT_COLORS = ['#ffffff', '#000000', '#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca'];

const FONT_SIZES: { label: string; value: FontSize; preview: string }[] = [
  { label: 'S',  value: 'small',  preview: 'text-sm'  },
  { label: 'M',  value: 'medium', preview: 'text-base' },
  { label: 'L',  value: 'large',  preview: 'text-lg'  },
  { label: 'XL', value: 'xlarge', preview: 'text-xl'  },
];

const MAX_CHARS = 300;

export default function StoryComposer({ isAdmin, onClose, onCreated }: StoryComposerProps) {
  const [text,       setText]       = useState('');
  const [bgColor,    setBgColor]    = useState('#6366f1');
  const [textColor,  setTextColor]  = useState('#ffffff');
  const [fontStyle,  setFontStyle]  = useState<FontStyle>('normal');
  const [fontSize,   setFontSize]   = useState<FontSize>('large');
  const [imageUrl,   setImageUrl]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState<'text' | 'design'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewFontClass: Record<FontSize, string> = {
    small:  'text-xl',
    medium: 'text-2xl',
    large:  'text-3xl',
    xlarge: 'text-4xl',
  };

  const previewFontStyle: React.CSSProperties = {
    fontWeight: fontStyle.includes('bold')   ? 700 : 400,
    fontStyle:  fontStyle.includes('italic') ? 'italic' : 'normal',
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
    if (!text.trim()) { setError('Please write something for your story.'); return; }
    setError('');
    setLoading(true);

    const payload: CreateStoryPayload = {
      textContent: text.trim(),
      bgColor,
      textColor,
      fontStyle,
      fontSize,
    };
    if (isAdmin && imageUrl) payload.imageUrl = imageUrl;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* ── Live Preview ── */}
        <div
          className="relative flex-shrink-0 w-full md:w-72 h-64 md:h-auto flex items-center justify-center p-6 transition-colors duration-300"
          style={{ background: bgColor }}
        >
          {isAdmin && imageUrl && (
            <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/30" />
          <p
            className={`relative text-center leading-snug wrap-break-word z-10 ${previewFontClass[fontSize]}`}
            style={{ color: textColor, textShadow: '0 2px 8px rgba(0,0,0,0.5)', ...previewFontStyle }}
          >
            {text || 'Your story preview will appear here…'}
          </p>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="h-0.75 bg-white/30 rounded-full">
              <div className="h-full bg-white rounded-full w-1/3" />
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Create Story</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {(['text', 'design'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {t === 'text' ? 'Text & Font' : 'Color & Design'}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {tab === 'text' ? (
              <>
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Write your story…"
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className={`absolute bottom-2.5 right-3 text-xs font-semibold ${text.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                    {text.length}/{MAX_CHARS}
                  </span>
                </div>

                {/* Font style toggles */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Font Style</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['normal', 'bold', 'italic', 'bolditalic'] as FontStyle[]).map((fs) => (
                      <button
                        key={fs}
                        onClick={() => setFontStyle(fs)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          fontStyle === fs
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                        style={{
                          fontWeight: fs.includes('bold')   ? 700 : 400,
                          fontStyle:  fs.includes('italic') ? 'italic' : 'normal',
                        }}
                      >
                        {fs === 'normal' ? 'Normal' : fs === 'bold' ? 'Bold' : fs === 'italic' ? 'Italic' : 'Bold Italic'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Font Size</p>
                  <div className="flex gap-2">
                    {FONT_SIZES.map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setFontSize(value)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${
                          fontSize === value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Direct Image Upload */}
                {isAdmin && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Background Photo (Admin Only)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                    {imageUrl ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium flex-1 truncate">Image Selected</span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <Upload size={15} />
                        Choose Photo from Device
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Background color */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Background Color</p>
                  <div className="flex flex-wrap gap-2.5">
                    {BG_PALETTES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBgColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          bgColor === c ? 'border-white ring-2 ring-indigo-500 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400" title="Custom Color">
                      <Palette size={14} className="text-gray-400" />
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="sr-only" />
                    </label>
                  </div>
                </div>

                {/* Text color */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Text Color</p>
                  <div className="flex flex-wrap gap-2.5">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          textColor === c ? 'ring-2 ring-indigo-500 scale-110 shadow-sm' : ''
                        }`}
                        style={{ background: c, borderColor: c === '#ffffff' ? '#d1d5db' : c }}
                        title={c}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400" title="Custom Text Color">
                      <Type size={14} className="text-gray-400" />
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="sr-only" />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-md"
            >
              {loading ? 'Sharing…' : 'Share Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
