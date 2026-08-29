'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Props {
  onClick: () => void;
}

export default function DMButton({ onClick }: Props) {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const d = await res.json();
    const count = (d.notifications ?? []).filter((n: { type: string; read: boolean }) => n.type === 'new_message' && !n.read).length;
    setUnread(count);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 15_000);
    return () => clearInterval(t);
  }, [fetchUnread]);

  async function handleClick() {
    // Mark all message notifications as read
    if (unread > 0) {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const d = await res.json();
        const msgIds = (d.notifications ?? [])
          .filter((n: { type: string; read: boolean }) => n.type === 'new_message' && !n.read)
          .map((n: { id: string }) => n.id);
        if (msgIds.length > 0) {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: msgIds }),
          });
          setUnread(0);
        }
      }
    }
    onClick();
  }

  if (!session) return null;

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-peat/50 hover:text-gold-dark transition-colors rounded-full"
      aria-label="Messages"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-burgundy rounded-full text-[9px] text-parchment-light flex items-center justify-center font-bold leading-none px-0.5">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
