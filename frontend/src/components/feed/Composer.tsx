'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/types';

interface ComposerProps {
  onPost: (post: Post) => void;
}

type Mode = 'post' | 'poll';

function containsLink(text?: string): boolean {
  if (!text) return false;
  const linkRegex = /(https?:\/\/|www\.|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  return linkRegex.test(text);
}

export function Composer({ onPost }: ComposerProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('post');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Post state
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [featured, setFeatured] = useState(false);
  const [pinned, setPinned] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Poll state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number | ''>('');
  const [pollExplanation, setPollExplanation] = useState('');

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMediaPreview(dataUrl);
      setMediaUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function clearMedia() {
    setMediaPreview(null);
    setMediaUrl('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim()) return toast.error('Please write something or attach a photo first');
    if (containsLink(text) || containsLink(explanation)) {
      return toast.error('Links and URLs are not allowed in posts');
    }
    setLoading(true);
    try {
      const { data } = await api.post<Post>('/posts', {
        text: text.trim() || undefined,
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType: mediaUrl.trim() ? 'IMAGE' : undefined,
        explanation: explanation.trim() || undefined,
        featured: user?.isAdmin ? featured : undefined,
        pinned: user?.isAdmin ? pinned : undefined,
      });
      onPost(data);
      setText(''); setMediaUrl(''); setMediaPreview(null); setExplanation('');
      setFeatured(false); setPinned(false);
      setShowModal(false);
      toast.success('Post shared successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create post');
    } finally { setLoading(false); }
  }

  async function submitPoll(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return toast.error('At least 2 options are required');
    if (!question.trim()) return toast.error('Question is required');
    if (
      containsLink(question) ||
      containsLink(pollExplanation) ||
      validOptions.some(opt => containsLink(opt))
    ) {
      return toast.error('Links and URLs are not allowed in poll questions or options');
    }
    setLoading(true);
    try {
      const { data } = await api.post<Post>('/posts/poll', {
        question: question.trim(),
        options: validOptions,
        correctAnswer: correctAnswer !== '' ? Number(correctAnswer) : undefined,
        explanation: pollExplanation.trim() || undefined,
        featured: user?.isAdmin ? featured : undefined,
        pinned: user?.isAdmin ? pinned : undefined,
      });
      onPost(data);
      setQuestion(''); setOptions(['', '']); setCorrectAnswer(''); setPollExplanation('');
      setFeatured(false); setPinned(false);
      setShowModal(false);
      toast.success('Poll created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create poll');
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* ─── Facebook App Style Trigger Card (Image 1 Circle 2) ─── */}
      <div className="card" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'white' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Avatar with subtle online status */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name} width={40} height={40} className="avatar" unoptimized />
            ) : (
              <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)', fontSize: 16 }}>
                {user?.name?.[0]}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 10, height: 10, borderRadius: '50%',
              background: '#22c55e', border: '2px solid white',
            }} />
          </div>

          {/* Pill Input */}
          <button
            onClick={() => { setMode('post'); setShowModal(true); }}
            style={{
              flex: 1, textAlign: 'left', padding: '10px 16px',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)', cursor: 'pointer',
              fontSize: 14, color: 'var(--color-ink-soft)',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            What's on your mind?
          </button>

          {/* Photo Button (Facebook Style) */}
          <button
            onClick={() => {
              setMode('post');
              setShowModal(true);
              setTimeout(() => imageInputRef.current?.click(), 100);
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 8, gap: 2, flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            title="Attach Photo"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#22c55e">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)' }}>Photo</span>
          </button>

          {/* Poll Button (Facebook Style) */}
          <button
            onClick={() => { setMode('poll'); setShowModal(true); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 8, gap: 2, flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            title="Create Poll"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--color-brand)">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2v-9h2v9zm4 0h-2v-4h2v4z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)' }}>Poll</span>
          </button>
        </div>
      </div>

      {/* ─── Modal Overlay ─── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(28,24,48,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 0, overflow: 'hidden', background: 'white' }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)' }}>
                {mode === 'post' ? 'Create Post' : 'Create Poll'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px 0' }}>
              <button
                onClick={() => setMode('post')}
                className={mode === 'post' ? 'btn-brand' : 'btn-ghost'}
                style={{ fontSize: 13, padding: '7px 16px' }}
              >Post</button>
              <button
                onClick={() => setMode('poll')}
                className={mode === 'poll' ? 'btn-brand' : 'btn-ghost'}
                style={{ fontSize: 13, padding: '7px 16px' }}
              >Poll</button>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              {/* User row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={40} height={40} className="avatar" unoptimized />
                ) : (
                  <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)', fontSize: 16 }}>
                    {user?.name?.[0]}
                  </div>
                )}
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)', display: 'block' }}>{user?.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-soft)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 99 }}>Public 🌐</span>
                </div>
              </div>

              {mode === 'post' ? (
                <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    className="input"
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    style={{ resize: 'none', lineHeight: 1.6 }}
                    autoFocus
                  />

                  {/* Media preview */}
                  {mediaPreview && (
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaPreview} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
                      <button
                        type="button"
                        onClick={clearMedia}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'rgba(28,24,48,0.7)', color: '#fff',
                          border: 'none', borderRadius: '50%', width: 28, height: 28,
                          cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  )}

                  {/* Photo attach row - Direct File Upload ONLY */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-ink-soft)', fontWeight: 500 }}>Attach Photo:</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '6px 14px' }}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {mediaPreview ? 'Change Photo' : 'Choose from Device'}
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageSelect}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 5 }}>
                      Explanation <span style={{ fontWeight: 400, color: 'var(--color-ink-faint)' }}>(optional)</span>
                    </label>
                    <textarea
                      className="input"
                      placeholder="Add extra context or explanation for this post..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      rows={2}
                      style={{ resize: 'none', fontSize: 13 }}
                    />
                  </div>

                  {user?.isAdmin && (
                    <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                        Pin to Top
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                        Feature Post
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-brand" disabled={loading} style={{ padding: '10px 28px' }}>
                      {loading ? 'Publishing…' : 'Publish Post'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitPoll} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 5 }}>
                      Question
                    </label>
                    <textarea
                      className="input"
                      placeholder="Ask a question…"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={3}
                      style={{ resize: 'none' }}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 8 }}>
                      Options (min 2, max 5)
                    </label>
                    {options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }} title="Mark as correct answer">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={correctAnswer === i}
                            onChange={() => setCorrectAnswer(i)}
                            style={{ accentColor: 'var(--color-brand)' }}
                          />
                        </label>
                        <input
                          className="input"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                          style={{ flex: 1, padding: '9px 14px', fontSize: 13 }}
                        />
                        {i >= 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setOptions(prev => prev.filter((_, j) => j !== i));
                              if (correctAnswer === i) setCorrectAnswer('');
                            }}
                            className="btn-ghost"
                            style={{ padding: '8px 10px', color: 'var(--color-accent)', flexShrink: 0 }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <p style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 6 }}>
                      Select the radio button next to an option if you wish to mark a correct answer
                    </p>
                    {options.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setOptions(p => [...p, ''])}
                        className="btn-ghost"
                        style={{ fontSize: 13, alignSelf: 'flex-start' }}
                      >+ Add Option</button>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 5 }}>
                      Explanation <span style={{ fontWeight: 400, color: 'var(--color-ink-faint)' }}>(shown after answering)</span>
                    </label>
                    <textarea
                      className="input"
                      placeholder="Explain the correct answer or add helpful context..."
                      value={pollExplanation}
                      onChange={(e) => setPollExplanation(e.target.value)}
                      rows={3}
                      style={{ resize: 'none', fontSize: 13 }}
                    />
                  </div>

                  {user?.isAdmin && (
                    <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                        Pin to Top
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                        Feature Poll
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-brand" disabled={loading} style={{ padding: '10px 28px' }}>
                      {loading ? 'Publishing…' : 'Publish Poll'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
