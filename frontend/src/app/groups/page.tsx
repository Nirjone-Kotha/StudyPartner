'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { LeftNav } from '@/components/layout/LeftNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import api from '@/lib/api';
import type { GroupItem } from '@/types';

const CATEGORIES = [
  'All',
  'BCS Preparation',
  'University Admission',
  'Medical Aspirants',
  'Science & Technology',
  'Mathematics & Logic',
  'General Knowledge',
  'Language Learning',
];

/* ─── Create Group Modal ─── */
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (group: GroupItem) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('BCS Preparation');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter a group name');
    setLoading(true);
    try {
      const { data } = await api.post<GroupItem>('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        isPrivate,
      });
      toast.success('Group created successfully');
      onCreated(data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

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
        style={{ width: '100%', maxWidth: 520, padding: 0, overflow: 'hidden' }}
      >
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-ink)' }}>
            Create Study Group
          </h2>
          <button
            onClick={onClose}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-soft)', padding: 4 }}
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
              Group Name <span style={{ color: 'var(--color-accent)' }}>*</span>
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 46th BCS Preparation Hub"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
              Category
            </label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {CATEGORIES.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this group discusses and studies…"
              rows={3}
              maxLength={300}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Privacy Choice */}
          <div style={{
            background: isPrivate ? '#fff3e0' : 'var(--color-brand-tint)',
            padding: 14, borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${isPrivate ? '#ff9800' : 'var(--color-brand)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-ink)' }}>
                  {isPrivate ? 'Private Group' : 'Public Group'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                  {isPrivate ? 'Only members can view discussions and posts' : 'Anyone can view posts and join this group'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: isPrivate ? '#ff9800' : 'var(--color-brand)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: isPrivate ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand" disabled={loading} style={{ padding: '10px 24px' }}>
              {loading ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const { user, hydrate } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [myGroups, setMyGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { hydrate(); }, [hydrate]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const [discoverRes, myRes] = await Promise.all([
        api.get<GroupItem[]>('/groups/discover'),
        api.get<GroupItem[]>('/groups/my'),
      ]);
      setGroups(discoverRes.data);
      setMyGroups(myRes.data);
    } catch {
      toast.error('Could not load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/groups/${groupId}/join`);
      toast.success('Joined group');
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  const currentList = activeTab === 'discover' ? groups : myGroups;
  const filteredGroups = currentList.filter(g => {
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Toaster position="top-center" />
      <Topbar />

      <div className="feed-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="left-sidebar"><LeftNav /></div>

        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Header Banner */}
          <div className="card" style={{
            padding: '24px 28px', marginBottom: 20,
            background: 'linear-gradient(135deg, #1C1830 0%, #3B2D60 50%, #6C4CFA 100%)',
            color: 'white', borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                Study Circles & Groups
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                Study Groups & Learning Communities
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', maxWidth: 500, lineHeight: 1.5 }}>
                Collaborate with peers, practice MCQs, and share knowledge by joining a group or creating your own.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'white', color: 'var(--color-brand)',
                border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '12px 24px', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'all 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Create New Group
            </button>
          </div>

          {/* Controls: Search, Tabs, Categories */}
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 14 }}>
              <button
                onClick={() => setActiveTab('discover')}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  background: activeTab === 'discover' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'discover' ? 'white' : 'var(--color-ink-soft)',
                  transition: 'all 0.15s',
                }}
              >
                Discover Groups ({groups.length})
              </button>
              <button
                onClick={() => setActiveTab('my')}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  background: activeTab === 'my' ? 'var(--color-brand)' : 'transparent',
                  color: activeTab === 'my' ? 'white' : 'var(--color-ink-soft)',
                  transition: 'all 0.15s',
                }}
              >
                My Groups ({myGroups.length})
              </button>
            </div>

            {/* Search + Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups (e.g. BCS, Medical, Engineering)…"
                style={{ borderRadius: 'var(--radius-pill)', padding: '10px 18px' }}
              />

              {/* Category pills */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px', border: 'none', borderRadius: 20,
                      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                      background: selectedCategory === cat ? 'var(--color-brand-tint)' : 'var(--color-bg)',
                      color: selectedCategory === cat ? 'var(--color-brand)' : 'var(--color-ink-soft)',
                      borderWidth: 1, borderStyle: 'solid',
                      borderColor: selectedCategory === cat ? 'var(--color-brand)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-ink-faint)' }}>
              Loading groups…
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-ink)', marginBottom: 6 }}>
                No groups found
              </h3>
              <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, marginBottom: 18 }}>
                {activeTab === 'my' ? 'You have not joined any groups yet.' : 'No groups in this category. You can create the first one!'}
              </p>
              <button
                className="btn-brand"
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '10px 24px' }}
              >
                Create Group
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="card"
                  onClick={() => router.push(`/groups/${group.id}`)}
                  style={{
                    padding: 0, overflow: 'hidden', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {/* Card Cover */}
                  <div style={{
                    height: 90,
                    background: group.coverImage
                      ? `url(${group.coverImage}) center/cover no-repeat`
                      : 'linear-gradient(135deg, var(--color-brand) 0%, #9F70FF 100%)',
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(0,0,0,0.6)', color: 'white',
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    }}>
                      {group.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--color-brand)',
                        background: 'var(--color-brand-tint)', padding: '2px 8px', borderRadius: 99,
                      }}>
                        {group.category}
                      </span>
                      {group.myRole === 'ADMIN' && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 99 }}>
                          Admin
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)', marginBottom: 6, lineHeight: 1.3 }}>
                      {group.name}
                    </h2>

                    {group.description && (
                      <p style={{
                        fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', marginBottom: 12,
                      }}>
                        {group.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', display: 'flex', gap: 10 }}>
                        <span>{group.membersCount} members</span>
                        <span>{group.postsCount} posts</span>
                      </div>

                      {group.isMember ? (
                        <button
                          className="btn-ghost"
                          onClick={(e) => { e.stopPropagation(); router.push(`/groups/${group.id}`); }}
                          style={{ fontSize: 12, padding: '6px 14px', fontWeight: 700, color: 'var(--color-brand)' }}
                        >
                          Visit →
                        </button>
                      ) : (
                        <button
                          className="btn-brand"
                          onClick={(e) => handleJoin(group.id, e)}
                          style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newGroup) => {
            setGroups(prev => [newGroup, ...prev]);
            setMyGroups(prev => [newGroup, ...prev]);
          }}
        />
      )}

      <MobileBottomNav />
    </div>
  );
}
