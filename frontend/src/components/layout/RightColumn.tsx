'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import type { User } from '@/types';

const PIC = (id: number, w = 260, h = 150) =>
  `https://picsum.photos/id/${id}/${w}/${h}`;

// Simulated online status like Update 3
const ONLINE_IDS = new Set<string>(); // will be populated dynamically

export function RightColumn() {
  const router = useRouter();
  const [contacts, setContacts] = useState<User[]>([]);

  useEffect(() => {
    api.get<User[]>('/users/contacts')
      .then((r) => {
        setContacts(r.data);
        // Mark first 3 contacts as online (simulated, like Update 3)
        r.data.slice(0, 3).forEach(u => ONLINE_IDS.add(u.id));
      })
      .catch(() => {});
  }, []);

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      position: 'sticky', top: 76,
      height: 'calc(100vh - 76px)',
      overflowY: 'auto', paddingTop: 8,
    }}>
      {/* Sponsored card — like Update 3 */}
      <div className="card" style={{ padding: '16px', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Sponsored
        </h3>
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PIC(1060)} alt="Sponsored" style={{ width: '100%', display: 'block', objectFit: 'cover' }} loading="lazy" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-ink)', marginBottom: 2 }}>
          Handmade pottery studio
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>studypartner.example</div>
      </div>

      {/* Contacts */}
      <div className="card" style={{ padding: '16px', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Contacts
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contacts.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', textAlign: 'center', padding: '8px 0' }}>
              No contacts yet
            </p>
          )}
          {contacts.map((c, i) => {
            const isOnline = i < 3; // first 3 are "online" like Update 3
            return (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onClick={() => router.push(`/profile?handle=${c.handle}`)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {c.avatar ? (
                    <Image src={c.avatar} alt={c.name} width={34} height={34} className="avatar" unoptimized />
                  ) : (
                    <div className="avatar" style={{ width: 34, height: 34, background: 'var(--color-brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-brand)', fontSize: 14 }}>
                      {c.name[0]}
                    </div>
                  )}
                  {/* Online dot */}
                  {isOnline && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#22c55e', border: '2px solid white',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: isOnline ? '#22c55e' : 'var(--color-ink-faint)', fontWeight: isOnline ? 600 : 400 }}>
                    {isOnline ? 'Active now' : 'Offline'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending topics */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Trending Topics
        </h3>
        {['#Bangladesh', '#TechTalks', '#Photography', '#FoodLovers', '#MCQChallenge'].map((tag) => (
          <div
            key={tag}
            style={{
              padding: '8px 0', borderBottom: '1px solid var(--color-border)',
              fontSize: 14, color: 'var(--color-brand)', fontWeight: 500, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-brand-dark)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-brand)')}
          >
            {tag}
          </div>
        ))}
      </div>
    </aside>
  );
}
