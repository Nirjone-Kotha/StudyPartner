'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { PostCard } from '@/components/feed/PostCard';
import { Composer } from '@/components/feed/Composer';
import api from '@/lib/api';
import type { User, Post } from '@/types';

/* ─── Edit Profile Modal ─── */
function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: User;
  onClose: () => void;
  onSave: (updated: User) => void;
}) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [institution, setInstitution] = useState(profile.institution ?? '');
  const [isPublic, setIsPublic] = useState(profile.isPublic !== false);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar ?? '');
  const [coverPreview, setCoverPreview] = useState<string>(profile.coverPhoto ?? '');
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  function readFile(file: File, cb: (dataUrl: string) => void) {
    const r = new FileReader();
    r.onload = (e) => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      const { data } = await api.patch<User>('/users/me', {
        name: name.trim(),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        institution: institution.trim() || undefined,
        isPublic,
        avatar: avatarPreview || undefined,
        coverPhoto: coverPreview || undefined,
      });
      updateUser(data);
      onSave(data);
      toast.success('Profile updated! ✅');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(28,24,48,0.60)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-ink)' }}>Edit Profile</h2>
          <button
            onClick={onClose}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Cover photo section */}
          <div style={{ position: 'relative' }}>
            <div style={{
              height: 140,
              background: coverPreview
                ? `url(${coverPreview}) center/cover no-repeat`
                : 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%)',
              cursor: 'pointer',
            }}
              onClick={() => coverRef.current?.click()}
            >
              {/* Overlay hint */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.28)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
              >
                <span style={{
                  color: 'white', fontSize: 13, fontWeight: 600,
                  background: 'rgba(0,0,0,0.5)', padding: '6px 14px',
                  borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6,
                  pointerEvents: 'none',
                }}>📷 Change Cover Photo</span>
              </div>
            </div>
            <button
              onClick={() => coverRef.current?.click()}
              style={{
                position: 'absolute', bottom: 10, right: 12,
                background: 'rgba(28,24,48,0.65)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              📷 Edit Cover
            </button>
            <input
              ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f, setCoverPreview); e.target.value = ''; }}
            />
          </div>

          {/* Avatar section */}
          <div style={{ padding: '0 24px', position: 'relative' }}>
            <div style={{ marginTop: -44, marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    style={{ width: 88, height: 88, borderRadius: '50%', border: '4px solid white', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%',
                    border: '4px solid white',
                    background: 'var(--color-brand-tint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: 'var(--color-brand)',
                  }}>
                    {profile.name[0]}
                  </div>
                )}
                <button
                  onClick={() => avatarRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-brand)', color: '#fff',
                    border: '2px solid white', cursor: 'pointer',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Change avatar"
                >📷</button>
                <input
                  ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f, setAvatarPreview); e.target.value = ''; }}
                />
              </div>
              <div style={{ paddingBottom: 4 }}>
                <p style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>Click the camera icon to change your photo</p>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
                  Full Name <span style={{ color: 'var(--color-accent)' }}>*</span>
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Your full name"
                />
              </div>

              {/* Bio */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
                  Bio <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-ink-faint)' }}>(optional · max 300 chars)</span>
                </label>
                <textarea
                  className="input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell people a little about yourself…"
                  style={{ resize: 'none', lineHeight: 1.6 }}
                />
                <p style={{ fontSize: 11, color: 'var(--color-ink-faint)', textAlign: 'right', marginTop: 3 }}>{bio.length}/300</p>
              </div>

              {/* Institution */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
                  🏫 Institution
                </label>
                <input
                  className="input"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. University of Dhaka, BUET…"
                />
              </div>

              {/* Location */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', display: 'block', marginBottom: 6 }}>
                  Location
                </label>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Dhaka, Bangladesh"
                />
              </div>

              {/* Privacy */}
              <div style={{
                background: isPublic ? 'var(--color-brand-tint)' : '#fff3e0',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                border: `1.5px solid ${isPublic ? 'var(--color-brand)' : '#ff9800'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>
                    {isPublic ? '🌐 Public Profile' : '🔒 Private Profile'}
                  </span>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setIsPublic(v => !v)}
                    style={{
                      width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                      background: isPublic ? 'var(--color-brand)' : '#ccc',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                    aria-label="Toggle profile privacy"
                  >
                    <span style={{
                      position: 'absolute', top: 3,
                      left: isPublic ? 25 : 3,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
                  {isPublic
                    ? 'Anyone can view your profile, posts, and activity.'
                    : 'Only your friends can see your posts. Your profile info is still visible to all.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '14px 24px', borderTop: '1px solid var(--color-border)', flexShrink: 0,
          background: 'white',
        }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 14 }}>Cancel</button>
          <button className="btn-brand" onClick={handleSave} disabled={loading} style={{ padding: '10px 28px', fontSize: 14 }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Friends List Modal ─── */
function FriendsListModal({
  handle,
  name,
  onClose,
}: {
  handle: string;
  name: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<{ isPublic: boolean; friends: any[]; userName?: string }>(`/users/${handle}/friends`)
      .then(({ data }) => {
        setIsPublic(data.isPublic !== false);
        setFriends(data.friends || []);
      })
      .catch(() => {
        setIsPublic(false);
        setFriends([]);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(28,24,48,0.60)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-ink)' }}>
            👥 Friends of {name} {!loading && isPublic ? `(${friends.length})` : ''}
          </h2>
          <button
            onClick={onClose}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 13 }}>
              Loading friends...
            </div>
          )}

          {!loading && !isPublic && (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-ink)' }}>This account is private</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                Only confirmed friends can view {name}&apos;s friends list.
              </div>
            </div>
          )}

          {!loading && isPublic && friends.length === 0 && (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>No friends found</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 4 }}>{name} has not added any friends yet.</div>
            </div>
          )}

          {!loading && isPublic && friends.map((f) => (
            <div
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 8px', borderBottom: '1px solid var(--color-border)', gap: 12,
              }}
            >
              <div
                onClick={() => { onClose(); router.push(`/profile?handle=${f.handle}`); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1, minWidth: 0 }}
              >
                {f.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.avatar} alt={f.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)' }}>
                    {f.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>@{f.handle}</div>
                  {f.institution && <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 2 }}>🏫 {f.institution}</div>}
                </div>
              </div>

              <button
                className="btn-ghost"
                onClick={() => { onClose(); router.push(`/profile?handle=${f.handle}`); }}
                style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Profile Content ─── */
function ProfileContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user: me, hydrate } = useAuth();
  const handle = params.get('handle');

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendStatus, setFriendStatus] = useState<{ status: 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIENDS'; requestId: string | null }>({ status: 'NONE', requestId: null });
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Redirect to own profile if no handle
  useEffect(() => {
    if (!handle && me) {
      router.replace(`/profile?handle=${me.handle}`);
    }
  }, [handle, me, router]);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    Promise.all([
      api.get<User>(`/users/${handle}`),
      api.get<Post[]>(`/users/${handle}/posts`),
    ]).then(([u, p]) => {
      setProfile(u.data);
      setPosts(p.data);
    }).catch(() => router.replace('/feed'))
      .finally(() => setLoading(false));
  }, [handle, router]);

  const isMe = me?.handle === handle;

  useEffect(() => {
    if (profile && !isMe) {
      api.get(`/friends/status/${profile.id}`)
        .then(res => setFriendStatus(res.data))
        .catch(() => {});
    }
  }, [profile, isMe]);

  const handleSendRequest = async () => {
    if (!profile) return;
    setFriendActionLoading(true);
    try {
      await api.post(`/friends/request/${profile.id}`);
      setFriendStatus({ status: 'REQUEST_SENT', requestId: null });
      toast.success('Friend request sent');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendStatus.requestId) return;
    setFriendActionLoading(true);
    try {
      await api.post(`/friends/request/${friendStatus.requestId}/accept`);
      setFriendStatus({ status: 'FRIENDS', requestId: null });
      if (profile) setProfile(p => p ? { ...p, friends: (p.friends || 0) + 1 } : p);
      toast.success('Friend request accepted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not accept request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
    if (profile) setProfile(p => p ? { ...p, _count: { posts: (p._count?.posts || 1) - 1 } } : p);
  }

  function handleNewPost(post: Post) {
    setPosts(prev => [post, ...prev]);
    if (profile) setProfile(p => p ? { ...p, _count: { posts: (p._count?.posts ?? 0) + 1 } } : p);
  }

  function handleProfileSaved(updated: User) {
    setProfile(prev => prev ? { ...prev, ...updated } : updated);
  }

  if (!handle && !me) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <p style={{ color: 'var(--color-ink-faint)' }}>Loading profile…</p>
      </div>
    );
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-ink-faint)' }}>Loading profile…</p>
      </div>
    </div>
  );

  if (!profile) return null;

  const images = posts.filter(p => p.mediaUrl && p.mediaType === 'IMAGE').slice(0, 9);
  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isPublic = profile.isPublic !== false;
  const isPrivateAndNotMe = !isPublic && !isMe;

  return (
    <>
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Cover & profile card */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          {/* Cover — clickable for own profile */}
          <div
            style={{
              height: 160,
              background: profile.coverPhoto
                ? `url(${profile.coverPhoto}) center/cover no-repeat`
                : 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%)',
              position: 'relative',
              cursor: isMe ? 'pointer' : 'default',
            }}
            onClick={() => { if (isMe) setShowEditModal(true); }}
          >
            {isMe && (
              <button
                style={{
                  position: 'absolute', bottom: 10, right: 12,
                  background: 'rgba(28,24,48,0.65)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
              >
                Edit Cover Photo
              </button>
            )}
          </div>

          {/* Avatar + info */}
          <div style={{ padding: '0 24px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ marginTop: -44 }}>
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    style={{ width: 88, height: 88, borderRadius: '50%', border: '4px solid white', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%',
                    border: '4px solid white',
                    background: 'var(--color-brand-tint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: 'var(--color-brand)',
                  }}>
                    {profile.name[0]}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Privacy badge */}
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 20, border: '1.5px solid',
                  borderColor: isPublic ? 'var(--color-brand)' : '#ff9800',
                  color: isPublic ? 'var(--color-brand)' : '#e65100',
                  background: isPublic ? 'var(--color-brand-tint)' : '#fff3e0',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
                {isMe ? (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {friendStatus.status === 'NONE' && (
                      <button
                        className="btn-brand"
                        disabled={friendActionLoading}
                        onClick={handleSendRequest}
                        style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        Add Friend
                      </button>
                    )}

                    {friendStatus.status === 'REQUEST_SENT' && (
                      <button
                        className="btn-ghost"
                        disabled
                        style={{ fontSize: 13, color: 'var(--color-ink-soft)', cursor: 'default' }}
                      >
                        Request Sent
                      </button>
                    )}

                    {friendStatus.status === 'REQUEST_RECEIVED' && (
                      <button
                        className="btn-brand"
                        disabled={friendActionLoading}
                        onClick={handleAcceptRequest}
                        style={{ fontSize: 13, background: '#16a34a' }}
                      >
                        Accept Request
                      </button>
                    )}

                    {friendStatus.status === 'FRIENDS' && (
                      <>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand)', background: 'var(--color-brand-tint)', padding: '6px 12px', borderRadius: 'var(--radius-pill)' }}>
                          Friends
                        </span>
                        <button
                          className="btn-brand"
                          style={{ fontSize: 13 }}
                          onClick={() => router.push(`/messages?partnerId=${profile.id}&name=${encodeURIComponent(profile.name)}&handle=${encodeURIComponent(profile.handle)}`)}
                        >
                          Message
                        </button>
                      </>
                    )}

                    {friendStatus.status !== 'FRIENDS' && (profile.isAdmin || me?.isAdmin) && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13 }}
                        onClick={() => router.push(`/messages?partnerId=${profile.id}&name=${encodeURIComponent(profile.name)}&handle=${encodeURIComponent(profile.handle)}`)}
                      >
                        Message (Admin)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>
              {profile.name}
              {profile.isAdmin && (
                <span className="badge badge-brand" style={{ marginLeft: 8, fontSize: 11 }}>⚡ Admin</span>
              )}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 10 }}>@{profile.handle}</p>

            {profile.bio && (
              <p style={{ fontSize: 15, color: 'var(--color-ink)', marginBottom: 14, lineHeight: 1.6 }}>{profile.bio}</p>
            )}

            {/* Intro details */}
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {profile.institution && <div>🏫 {profile.institution}</div>}
              {profile.location
                ? <div>📍 Lives in {profile.location}</div>
                : <div>📍 Lives in Sylhet, Bangladesh</div>
              }
              <div>📅 Joined {joinedDate}</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div
                onClick={() => setShowFriendsModal(true)}
                style={{
                  cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                  marginLeft: -8, transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-brand-tint)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                title="Click to view all friends"
              >
                <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-brand)' }}>{profile.friends}</span>
                <span style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginLeft: 4, textDecoration: 'underline', textUnderlineOffset: 3 }}>Friends</span>
              </div>

              <div>
                <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-ink)' }}>{profile._count?.posts ?? posts.length}</span>
                <span style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginLeft: 4 }}>Posts</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Left column: intro card + photos */}
          <div style={{ width: 220, flexShrink: 0 }}>
            {/* Intro card */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-soft)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Intro
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-ink-soft)' }}>
                {profile.institution && <div>🏫 {profile.institution}</div>}
                {profile.location
                  ? <div>📍 {profile.location}</div>
                  : <div>📍 Sylhet, Bangladesh</div>
                }
                <div>📅 Joined {joinedDate}</div>
                <div>{isPublic ? '🌐 Public' : '🔒 Private'}</div>
              </div>
              {isMe && (
                <button
                  className="btn-ghost"
                  style={{ width: '100%', marginTop: 12, fontSize: 13 }}
                  onClick={() => setShowEditModal(true)}
                >
                  ✏️ Edit Details
                </button>
              )}
            </div>

            {/* Photos grid */}
            {images.length > 0 && !isPrivateAndNotMe && (
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-soft)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Photos
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {images.map((p) => (
                    <div key={p.id} style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.mediaUrl!}
                        alt="photo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: composer (own profile only) + posts */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isMe && <Composer onPost={handleNewPost} />}

            {/* Private profile notice */}
            {isPrivateAndNotMe && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🔒</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)', marginBottom: 6 }}>This account is private</p>
                <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
                  Follow this account to see their posts.
                </p>
              </div>
            )}

            {!isPrivateAndNotMe && posts.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🗒️</p>
                <p style={{ color: 'var(--color-ink-soft)' }}>No posts yet — share your first update!</p>
              </div>
            )}
            {!isPrivateAndNotMe && posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSaved}
        />
      )}

      {/* Friends List Modal */}
      {showFriendsModal && (
        <FriendsListModal
          handle={profile.handle}
          name={profile.name}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </>
  );
}

export default function ProfilePage() {
  const { hydrate } = useAuth();
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />
      <div className="feed-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="left-sidebar"><LeftNav /></div>
        <Suspense fallback={
          <div style={{ flex: 1, padding: 40, textAlign: 'center', color: 'var(--color-ink-faint)' }}>
            Loading…
          </div>
        }>
          <ProfileContent />
        </Suspense>
      </div>
      <MobileBottomNav />
    </div>
  );
}
