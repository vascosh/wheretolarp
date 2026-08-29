'use client';

/**
 * Share modal for feed posts.
 *  - Top: friends list — tapping a row DMs the post link to that friend
 *    (creates the conversation if it doesn't exist).
 *  - Bottom: "Share externally" — uses the Web Share API on mobile,
 *    falls back to copying the link with a soft inline toast (no alert).
 */

import { useEffect, useState } from 'react';

interface Friend {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

interface Props {
  postId: string;
  postCaption?: string | null;
  authorName?: string | null;
  onClose: () => void;
}

export default function SharePostModal({ postId, postCaption, authorName, onClose }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const url = typeof window !== 'undefined' ? `${window.location.origin}/feed?p=${postId}` : '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/friends');
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setFriends(d.friends ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function flash(msg: string, ms = 1600) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function sendToFriend(friend: Friend) {
    if (sent.has(friend.id) || sending) return;
    setSending(friend.id);
    try {
      // 1. get-or-create conversation
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: friend.id }),
      });
      const conv = await convRes.json();
      if (!convRes.ok) throw new Error(conv.error ?? 'Could not open conversation');

      // 2. send message with the post link
      const lead = authorName ? `${authorName} on Where To LARP` : 'Check this LARP';
      const msgContent = `${lead}\n${url}` + (postCaption ? `\n\n"${postCaption.slice(0, 140)}"` : '');
      const sendRes = await fetch(`/api/conversations/${conv.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgContent }),
      });
      if (!sendRes.ok) throw new Error('Send failed');

      setSent((prev) => new Set(prev).add(friend.id));
    } catch {
      flash('Could not send');
    } finally {
      setSending(null);
    }
  }

  async function externalShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Where To LARP', text: postCaption ?? '', url });
        return;
      } catch {/* user cancelled */}
    }
    try {
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch {
      flash('Could not copy');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="absolute inset-0 bg-peat/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm max-h-[80vh] card-paper flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(16, 17, 20,0.25)] animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-peat/10 flex items-center justify-between shrink-0">
          <div>
            <p className="eyebrow mb-1.5">Share</p>
            <h3 className="headline-editorial text-xl">Send to a <span className="italic text-gold-dark">friend</span></h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-peat/40 hover:text-gold-dark p-1 transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Friends list */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {loading ? (
            <div className="p-6 text-center text-peat/40 text-sm">Loading friends…</div>
          ) : friends.length === 0 ? (
            <div className="p-6 text-center">
              <p className="eyebrow mb-2">No friends yet</p>
              <p className="font-sans text-peat/50 text-xs">
                Add some from someone&apos;s profile to share posts in-app.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {friends.map((f) => {
                const isSent = sent.has(f.id);
                const isSending = sending === f.id;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => sendToFriend(f)}
                      disabled={isSent || sending !== null}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-parchment-dark/50 active:bg-parchment-dark/70 transition-colors text-left disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                      <Avatar name={f.name} image={f.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-forest text-sm truncate">
                          {f.name ?? 'Friend'}
                        </p>
                      </div>
                      {isSent ? (
                        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-gold-dark font-semibold">
                          Sent ✓
                        </span>
                      ) : isSending ? (
                        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40">
                          Sending…
                        </span>
                      ) : (
                        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-forest/70 px-3 py-1 border border-forest/25">
                          Send
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* External share footer */}
        <div className="px-3 py-3 border-t border-peat/10 shrink-0">
          <button
            onClick={externalShare}
            className="w-full flex items-center justify-center gap-2 py-3 border border-forest/30 text-forest font-sans text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-forest/5 hover:border-forest transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Share Externally
          </button>
        </div>

        {/* Inline soft toast (no native alert) */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-forest text-parchment-light text-xs font-sans tracking-wide shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover border border-gold/30 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-sans font-semibold text-forest shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #4B5DF0, #1B2FDE)', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
