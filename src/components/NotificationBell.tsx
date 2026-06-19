'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

interface Props {
  onOpenDMs: (convId?: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function notifIcon(type: string) {
  if (type === 'new_message') return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/70">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
  if (type === 'friend_request') return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'rgba(168,200,232,0.12)', border: '1px solid rgba(168,200,232,0.2)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a8c8e8]/70">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (type === 'now_following' || type === 'friend_accepted') return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/80">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M22 11l-3 3-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cream/40">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function NotificationBell({ onOpenDMs }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const d = await res.json();
      // Exclude message notifications — those are handled by the DM button
      const nonMessage = (d.notifications ?? []).filter((n: Notification) => n.type !== 'new_message');
      setNotifications(nonMessage);
      setUnreadCount(nonMessage.filter((n: Notification) => !n.read).length);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 15_000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    if (n.type === 'new_message' && n.data?.conversation_id) {
      setOpen(false);
      onOpenDMs(n.data.conversation_id);
      return;
    }
    // Tapping a "now following" or "friend accepted" notification opens that user's profile.
    const profileTarget = n.data?.sender_id ?? n.data?.accepter_id;
    if ((n.type === 'now_following' || n.type === 'friend_accepted') && profileTarget) {
      setOpen(false);
      router.push(`/u/${profileTarget}`);
    }
  }

  async function acceptFriendRequest(n: Notification) {
    if (processingIds.has(n.id)) return;
    setProcessingIds(s => new Set(s).add(n.id));
    const res = await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId: n.data.friendship_id }),
    });
    if (res.ok) {
      // Optimistic: remove the request UI immediately, then refresh so the
      // server-side conversion to "X started following you" appears in place.
      setNotifications(ns => ns.filter(x => x.id !== n.id));
      setUnreadCount(c => Math.max(0, c - (n.read ? 0 : 1)));
      fetchNotifs();
    }
    setProcessingIds(s => { const next = new Set(s); next.delete(n.id); return next; });
  }

  async function declineFriendRequest(n: Notification) {
    if (processingIds.has(n.id)) return;
    setProcessingIds(s => new Set(s).add(n.id));
    const res = await fetch(`/api/friends?id=${n.data.friendship_id}`, { method: 'DELETE' });
    if (res.ok) {
      // Server deletes the row outright on decline; just mirror that locally.
      setNotifications(ns => ns.filter(x => x.id !== n.id));
      setUnreadCount(c => Math.max(0, c - (n.read ? 0 : 1)));
    }
    setProcessingIds(s => { const next = new Set(s); next.delete(n.id); return next; });
  }

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          const wasOpen = open;
          setOpen(o => !o);
          if (!wasOpen && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 text-charcoal/50 hover:text-champagne transition-colors rounded-full"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-sm overflow-hidden shadow-modal z-50 animate-scale-in"
          style={{ background: '#060D18', border: '1px solid rgba(201,169,110,0.18)' }}
        >
          <div className="px-4 py-3.5 border-b border-champagne/12 flex items-center justify-between">
            <p className="eyebrow">Notifications</p>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-champagne/50 hover:text-champagne transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-sans text-cream/20 text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map(n => {
                const isFriendReq = n.type === 'friend_request' && n.data?.friendship_id;
                const processing = processingIds.has(n.id);

                if (isFriendReq) {
                  return (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? 'bg-champagne/[0.04]' : ''}`}>
                      {notifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`font-sans text-xs leading-snug ${!n.read ? 'text-cream/90 font-medium' : 'text-cream/60'}`}>
                          {n.title}
                        </p>
                        <p className="font-sans text-[10px] text-cream/20 mt-1">{timeAgo(n.created_at)}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => acceptFriendRequest(n)}
                            disabled={processing}
                            className="px-3 py-1 rounded-full bg-champagne text-navy font-sans text-[10px] font-semibold tracking-wider uppercase disabled:opacity-50">
                            Accept
                          </button>
                          <button
                            onClick={() => declineFriendRequest(n)}
                            disabled={processing}
                            className="px-3 py-1 rounded-full border border-white/[0.1] text-cream/35 font-sans text-[10px] tracking-wider uppercase hover:text-cream/60 transition-colors disabled:opacity-50">
                            Decline
                          </button>
                        </div>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-champagne shrink-0 mt-1" />}
                    </div>
                  );
                }

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.04] transition-all ${!n.read ? 'bg-champagne/[0.04]' : ''}`}
                  >
                    {notifIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`font-sans text-xs leading-snug ${!n.read ? 'text-cream/90 font-medium' : 'text-cream/60'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="font-sans text-[11px] text-cream/35 mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="font-sans text-[10px] text-cream/20 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-champagne shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
