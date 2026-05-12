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
      <div className="flex items-center gap-3 justify-center mt-6">
        <span className="font-sans text-xs text-cream/40 tracking-widest uppercase">Friends</span>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="px-4 py-1.5 rounded-full border border-white/[0.08] text-cream/30 font-sans text-[10px] tracking-widest uppercase hover:border-red-500/30 hover:text-red-400/60 transition-all disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <div className="flex items-center gap-3 justify-center mt-6">
        <span className="font-sans text-xs text-cream/30 tracking-widest uppercase">Request Sent</span>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="px-4 py-1.5 rounded-full border border-white/[0.08] text-cream/25 font-sans text-[10px] tracking-widest uppercase hover:text-cream/50 transition-all disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-3 justify-center mt-6">
        <span className="font-sans text-xs text-cream/40 tracking-widest uppercase">Wants to connect</span>
        <button
          onClick={acceptRequest}
          disabled={loading}
          className="px-5 py-2 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/20 transition-all disabled:opacity-40"
        >
          Accept
        </button>
        <button
          onClick={removeRequest}
          disabled={loading}
          className="px-4 py-1.5 rounded-full border border-white/[0.08] text-cream/30 font-sans text-[10px] tracking-widest uppercase hover:text-cream/50 transition-all disabled:opacity-40"
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
        className="px-6 py-2 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/20 transition-all disabled:opacity-40"
      >
        {loading ? 'Sending…' : 'Add Friend'}
      </button>
    </div>
  );
}
