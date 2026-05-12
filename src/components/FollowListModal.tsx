'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface UserRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface Props {
  type: 'followers' | 'following';
  userId: string;
  isOwnProfile: boolean;
  onClose: () => void;
  onStatsChange: () => void;
}

function UserAvatar({ name, image, size = 38 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image) {
    return <img src={image} alt={name ?? ''} referrerPolicy="no-referrer"
      className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function FollowListModal({ type, userId, isOwnProfile, onClose, onStatsChange }: Props) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/users/${userId}/${type}`);
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users ?? []);
    }
    setLoading(false);
  }, [userId, type]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function removeFollower(targetId: string) {
    if (processing.has(targetId)) return;
    setProcessing(s => new Set(s).add(targetId));
    await fetch(`/api/users/${targetId}/followers`, { method: 'DELETE' });
    setUsers(us => us.filter(u => u.id !== targetId));
    onStatsChange();
    setProcessing(s => { const n = new Set(s); n.delete(targetId); return n; });
  }

  async function unfollow(targetId: string) {
    if (processing.has(targetId)) return;
    setProcessing(s => new Set(s).add(targetId));
    await fetch(`/api/users/${targetId}/followers`, { method: 'DELETE' });
    setUsers(us => us.filter(u => u.id !== targetId));
    onStatsChange();
    setProcessing(s => { const n = new Set(s); n.delete(targetId); return n; });
  }

  async function blockUser(targetId: string) {
    if (processing.has(targetId)) return;
    setProcessing(s => new Set(s).add(targetId));
    await fetch(`/api/users/${targetId}/block`, { method: 'POST' });
    setUsers(us => us.filter(u => u.id !== targetId));
    onStatsChange();
    setProcessing(s => { const n = new Set(s); n.delete(targetId); return n; });
  }

  const canManage = isOwnProfile && !!session?.user?.id;

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-[501] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl overflow-hidden shadow-modal"
        style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="font-serif text-cream/90 text-base font-semibold capitalize">{type}</p>
          <button onClick={onClose} className="text-cream/30 hover:text-cream transition-colors p-1.5 rounded-full hover:bg-white/[0.06]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-champagne/20 border-t-champagne rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-sans text-cream/20 text-sm">No {type} yet</p>
            </div>
          ) : (
            users.map(u => {
              const busy = processing.has(u.id);
              return (
                <div key={u.id} className="px-5 py-3 flex items-center gap-3 border-b border-white/[0.04] last:border-0">
                  <Link href={`/u/${u.id}`} onClick={onClose} className="shrink-0">
                    <UserAvatar name={u.name} image={u.avatar_url} />
                  </Link>
                  <Link href={`/u/${u.id}`} onClick={onClose} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <p className="font-sans text-sm text-cream/80 font-medium truncate">{u.name ?? 'Member'}</p>
                    {u.username && <p className="font-sans text-[10px] text-cream/30 truncate">@{u.username}</p>}
                  </Link>
                  {canManage && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => type === 'followers' ? removeFollower(u.id) : unfollow(u.id)}
                        disabled={busy}
                        className="px-2.5 py-1 rounded-full border border-white/[0.1] text-cream/35 font-sans text-[10px] tracking-wider uppercase hover:text-cream/60 hover:border-white/[0.2] transition-all disabled:opacity-40"
                      >
                        {type === 'followers' ? 'Remove' : 'Unfollow'}
                      </button>
                      <button
                        onClick={() => blockUser(u.id)}
                        disabled={busy}
                        className="px-2.5 py-1 rounded-full border border-red-500/20 text-red-400/50 font-sans text-[10px] tracking-wider uppercase hover:text-red-400/80 hover:border-red-500/40 transition-all disabled:opacity-40"
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
