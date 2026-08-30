'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { AuthResponse } from '@/types';

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, hydrate, user } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', handle: '', password: '' });

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (user) router.replace('/feed');
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', loginForm);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/feed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', signupForm);
      setAuth(data.user, data.token);
      toast.success(`Welcome to Study Partner, ${data.user.name}! 🎉`);
      router.push('/feed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-brand-tint) 0%, var(--color-bg) 50%, var(--color-accent-tint) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <Toaster position="top-center" />

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: 'white', padding: '12px 28px',
            borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-md)', marginBottom: 16,
          }}>
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--color-brand)"/>
              <path d="M7 10C7 9.44772 7.44772 9 8 9H14C15.1046 9 16 9.89543 16 11V22C16 22 14.5 21 12 21H8C7.44772 21 7 20.5523 7 20V10Z" fill="white" fillOpacity="0.9"/>
              <path d="M25 10C25 9.44772 24.5523 9 24 9H18C16.8954 9 16 9.89543 16 11V22C16 22 17.5 21 20 21H24C24.5523 21 25 20.5523 25 20V10Z" fill="white" fillOpacity="0.7"/>
              <rect x="9" y="12" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
              <rect x="9" y="14.5" width="4" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
              <rect x="9" y="17" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.6"/>
              <rect x="18" y="12" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
              <rect x="18" y="14.5" width="4" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
              <rect x="18" y="17" width="5" height="1.2" rx="0.6" fill="var(--color-brand)" fillOpacity="0.4"/>
              <rect x="15.2" y="10" width="1.6" height="12" rx="0.8" fill="white"/>
            </svg>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
              color: 'var(--color-brand)', letterSpacing: '-0.5px',
            }}>Study Partner</span>
          </div>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 15 }}>
            Connect, collaborate, and learn together
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 28,
          }}>
            {(['login', 'signup'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'var(--color-brand)' : 'var(--color-ink-soft)',
                boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
              }}>
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <button className="btn-brand" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Logging in…' : 'Log In'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-ink-soft)' }}>
                <a href="/admin/login" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600 }}>
                  Go to Admin Panel →
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>Full Name</label>
                  <input className="input" placeholder="Jane Doe" required minLength={2}
                    value={signupForm.name} onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>Handle</label>
                  <input className="input" placeholder="jane.doe" required minLength={3}
                    value={signupForm.handle} onChange={(e) => setSignupForm(f => ({ ...f, handle: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>Email</label>
                <input className="input" type="email" placeholder="you@example.com" required
                  value={signupForm.email} onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', marginBottom: 6 }}>Password</label>
                <input className="input" type="password" placeholder="Min. 8 characters" required minLength={8}
                  value={signupForm.password} onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <button className="btn-brand" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
