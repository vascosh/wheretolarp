'use client';

import { useState } from 'react';

type Status = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export default function AddFriendButton({
  targetId,
  initialStatus,
  friendshipId,
}: {
  targetId: string;
  initialStatus: Status;
  friendshipId?: string;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [fId, setFId] = useState(friendshipId);
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    setLoading(true);
    const res = await fetch('/api/friends/by-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    });
    if (res.ok) setStatus('pending_sent');
    setLoading(false);
  }

  async function acceptRequest() {
    if (!fId) return;
    setLoading(true);
    const res = await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId: fId }),
    });
    if (res.ok) setStatus('accepted');
    setLoading(false);
  }

  async function removeRequest() {
    if (!fId) return;
    setLoading(true);
    await fetch(`/api/friends?id=${fId}`, { method: 'DELETE' });
    setStatus('none');
    setFId(undefined);
    setLoading(false);
  }

  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-4 justify-center mt-6">
        <span className="eyebrow-muted">In the Register</span>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/30 border-b border-transparent hover:text-red-400/70 hover:border-red-400/40 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Remove
        </button>
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <div className="flex items-center gap-4 justify-center mt-6">
        <span className="eyebrow-muted">Request Sent</span>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/30 border-b border-transparent hover:text-cream/60 hover:border-cream/30 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex flex-wrap items-center gap-4 justify-center mt-6">
        <span className="eyebrow-muted">Wishes to connect</span>
        <button
          onClick={acceptRequest}
          disabled={loading}
          className="btn-editorial disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Accept
        </button>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/30 border-b border-transparent hover:text-cream/60 hover:border-cream/30 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Decline
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={sendRequest}
        disabled={loading}
        className="btn-editorial-ghost disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {loading ? 'Sending…' : 'Add to Register'}
      </button>
    </div>
  );
}
