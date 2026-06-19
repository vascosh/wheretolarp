'use client';

/**
 * Compact, floating "Messages" launcher pinned to the bottom-left of the
 * viewport. Used on the feed page so DMs are one tap away without leaving
 * the timeline. Opens the existing <DMSidebar /> via the global `openDM`
 * event that Navigation already listens for, so we don't have to render
 * another sidebar instance here.
 *
 * Hidden when signed out.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function FeedDMLauncher() {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const d = await res.json();
      const count = (d.notifications ?? []).filter(
        (n: { type: string; read: boolean }) => n.type === 'new_message' && !n.read
      ).length;
      setUnread(count);
    } catch {/* ignore */}
  }, [session?.user?.id]);

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 15_000);
    return () => clearInterval(t);
  }, [fetchUnread]);

  function open() {
    setUnread(0);
    window.dispatchEvent(new CustomEvent('openDM'));
  }

  if (!session) return null;

  return (
    <button
      onClick={open}
      aria-label={unread > 0 ? `Messages — ${unread} unread` : 'Messages'}
      className="group fixed z-30 left-3 sm:left-5 pl-3 pr-4 sm:pl-3.5 sm:pr-5 h-11 sm:h-12 rounded-full border border-champagne/30 bg-ink/85 backdrop-blur-md text-cream shadow-[0_4px_24px_rgba(0,0,0,0.45)] hover:border-champagne/70 hover:bg-ink hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <span className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-champagne/15 text-champagne">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none px-1 ring-2 ring-navy"
            aria-hidden
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      <span className="font-sans text-[11px] tracking-[0.25em] uppercase font-semibold">
        Messages
      </span>
    </button>
  );
}
