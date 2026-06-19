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
      <div className="fixed inset-0 z-[500] bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-[501] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm overflow-hidden bg-ink border border-champagne/20 shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-label={type}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-champagne/15 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">The Register</p>
            <h2 className="headline-editorial text-cream text-xl capitalize">{type}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-cream/30 hover:text-champagne transition-colors p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50">
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
            <div className="py-14 text-center">
              <p className="font-display italic text-cream/30 text-lg">No {type} yet</p>
            </div>
          ) : (
            users.map(u => {
              const busy = processing.has(u.id);
              return (
                <div key={u.id} className="px-5 py-3.5 flex items-center gap-3 border-b border-champagne/10 last:border-0">
                  <Link href={`/u/${u.id}`} onClick={onClose} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 rounded-full">
                    <UserAvatar name={u.name} image={u.avatar_url} />
                  </Link>
                  <Link href={`/u/${u.id}`} onClick={onClose} className="flex-1 min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 rounded-sm">
                    <p className="font-serif text-sm text-cream/85 truncate">{u.name ?? 'Member'}</p>
                    {u.username && <p className="font-sans text-[10px] tracking-wider text-champagne/40 truncate">@{u.username}</p>}
                  </Link>
                  {canManage && (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => type === 'followers' ? removeFollower(u.id) : unfollow(u.id)}
                        disabled={busy}
                        className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 border-b border-transparent hover:text-cream/70 hover:border-cream/30 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
                      >
                        {type === 'followers' ? 'Remove' : 'Unfollow'}
                      </button>
                      <button
                        onClick={() => blockUser(u.id)}
                        disabled={busy}
                        className="font-sans text-[10px] tracking-[0.2em] uppercase text-red-400/50 border-b border-transparent hover:text-red-400/85 hover:border-red-400/40 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
