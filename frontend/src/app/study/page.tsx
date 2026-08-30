'use client';
import { Toaster } from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function StudyZonePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />
      <div className="feed-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="left-sidebar">
          <LeftNav />
        </div>
        <main className="feed-main" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <div className="card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: 480, width: '100%' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-brand)', marginBottom: 8, letterSpacing: '-0.5px' }}>
              Study Zone
            </h1>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent))',
              color: 'white',
              padding: '6px 18px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 20,
              letterSpacing: '0.5px',
            }}>
              COMING SOON
            </div>
            <p style={{ fontSize: 15, color: 'var(--color-ink-soft)', lineHeight: 1.7 }}>
              Study Zone will include flashcards, interactive quizzes, note sharing, and competitive leaderboards.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              {['Notes', 'Quizzes', 'Flashcards', 'Leaderboard'].map(tag => (
                <span key={tag} style={{
                  padding: '6px 14px', background: 'var(--color-brand-tint)',
                  color: 'var(--color-brand)', borderRadius: 99, fontSize: 13, fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="show-on-mobile" style={{ height: 20 }} />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
