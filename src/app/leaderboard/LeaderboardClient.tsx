'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TierBadge from '@/components/TierBadge';
import type { Tier } from '@/lib/tiers';
import { TIER_META } from '@/lib/tiers';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  score: number;
  challenges_completed: number;
  tier: Tier;
  pinned?: boolean;
  pin_expires_at?: string;
}

function Avatar({ name, image, size = 38 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image) {
    return (
      <img src={image} alt={name ?? ''} referrerPolicy="no-referrer"
        className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div className="w-8 h-8 shrink-0 flex items-center justify-center">
      <span className="font-sans text-sm text-cream/40">{rank}</span>
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className={className}>
      <path d="M1 15L3.5 5L7.5 9.5L10 2L12.5 9.5L16.5 5L19 15H1Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${m}m ${String(s).padStart(2, '0')}s`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span className="tabular-nums">{label}</span>;
}

function CheckoutForm({ clientSecret, onSuccess, onClose }: { clientSecret: string; onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message ?? 'Card error'); setLoading(false); return; }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setLoading(false);
      return;
    }

    const pinRes = await fetch('/api/leaderboard/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: paymentIntent?.id }),
    });

    if (!pinRes.ok) {
      const pinErr = await pinRes.json().catch(() => ({}));
      setError(`Your payment went through but we couldn't save your spot. Error: ${pinErr.error ?? 'unknown'}`);
    } else {
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <p className="font-sans text-xs text-red-400 text-center">{error}</p>
      )}
      <button type="submit" disabled={!stripe || loading}
        className="w-full py-3 rounded-full font-sans text-xs tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.4)', color: '#C9A96E' }}>
        {loading ? 'Processing…' : 'Pay $9.99'}
      </button>
      <button type="button" onClick={onClose}
        className="w-full py-2.5 rounded-full border border-white/[0.07] text-cream/25 font-sans text-xs tracking-widest uppercase hover:text-cream/45 transition-all">
        Cancel
      </button>
    </form>
  );
}

function PinModal({ onClose, onPinned }: { onClose: () => void; onPinned: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  async function handleStartPayment() {
    const res = await fetch('/api/leaderboard/pin/intent', { method: 'POST' });
    if (!res.ok) return;
    const { clientSecret: cs } = await res.json();
    setClientSecret(cs);
  }

  function handleSuccess() {
    setSuccess(true);
    onPinned();
    setTimeout(onClose, 2000);
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)' }} />
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}>
              <CrownIcon className="text-champagne" />
            </div>
            <h2 className="font-serif text-cream text-xl font-semibold mb-2">Larp the #1 Spot</h2>
            <p className="font-sans text-cream/35 text-sm leading-relaxed">
              Pin yourself at the top of the LARP leaderboard for 1 hour.
            </p>
            <p className="font-serif text-champagne text-4xl font-semibold mt-4 mb-0.5"><span className="text-2xl align-top mt-1 inline-block">$</span>9.99</p>
            <p className="font-sans text-[10px] text-cream/20 tracking-widest uppercase">per hour</p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <p className="font-serif text-champagne text-lg font-semibold">You&apos;re #1 👑</p>
              <p className="font-sans text-cream/35 text-xs mt-1">Your pin is live for the next hour.</p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#C9A96E', borderRadius: '12px' } } }}>
              <CheckoutForm clientSecret={clientSecret} onSuccess={handleSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <div className="space-y-3">
              <button onClick={handleStartPayment}
                className="w-full py-3 rounded-full font-sans text-xs tracking-widest uppercase transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.4)', color: '#C9A96E' }}>
                Purchase · $9.99
              </button>
              <button onClick={onClose}
                className="w-full py-2.5 rounded-full border border-white/[0.07] text-cream/25 font-sans text-xs tracking-widest uppercase hover:text-cream/45 transition-all">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TIER_GUIDE = [
  { tier: 'bronze',   min: 1,    max: 299  },
  { tier: 'silver',   min: 300,  max: 599  },
  { tier: 'gold',     min: 600,  max: 899  },
  { tier: 'platinum', min: 900,  max: 1499 },
  { tier: 'diamond',  min: 1500, max: null },
] as const;

interface SearchResult {
  rank: number;
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  score: number;
  tier: Tier;
}

export default function LeaderboardClient() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  async function handleAddPinnedFriend(userId: string) {
    if (addingFriend || friendAdded) return;
    setAddingFriend(true);
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId }),
      });
      setFriendAdded(true);
    } catch {}
    finally { setAddingFriend(false); }
  }

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30_000);
    // Track first leaderboard visit of the day for challenges
    fetch('/api/challenges/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leaderboard' }),
    }).catch(() => {});
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/leaderboard/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults((await res.json()).results ?? []);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!searchRef.current?.contains(e.target as Node)) setSearchResults([]);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pinnedEntry = entries.find(e => e.pinned);
  const myEntry = session?.user?.id ? entries.find(e => e.id === session.user.id) ?? null : null;

  return (
    <div className="min-h-screen pt-nav"
      style={{ background: 'linear-gradient(160deg, #0e1e35 0%, #152844 60%, #0b1a2e 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(201,169,110,0.07) 0%, transparent 60%)' }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-champagne/35 mb-3">Competition</p>
          <h1 className="font-serif text-cream text-4xl font-semibold mb-3">The Leaderboard</h1>
          <p className="font-sans text-cream/25 text-sm">Compete. Climb. LARP your way to the top.</p>
        </div>

        {/* Tier legend */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map(t => (
            <TierBadge key={t} tier={t} size="sm" />
          ))}
        </div>

        {/* #1 spot — active pin or CTA */}
        {pinnedEntry ? (
          <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
            style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.22)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.55), transparent)' }} />
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <CrownIcon className="text-champagne" />
                <span className="font-sans text-[8px] text-champagne/40 tracking-[0.2em] uppercase">#1</span>
              </div>
              <Avatar name={pinnedEntry.name} image={pinnedEntry.avatar_url} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/u/${pinnedEntry.id}`}
                    className="font-serif text-cream text-base font-semibold hover:text-champagne transition-colors">
                    {pinnedEntry.name ?? 'Member'}
                  </Link>
                  {session?.user?.id && session.user.id !== pinnedEntry.id && (
                    <button
                      onClick={() => handleAddPinnedFriend(pinnedEntry.id)}
                      disabled={addingFriend || friendAdded}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-all disabled:opacity-60"
                      style={{ background: friendAdded ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: friendAdded ? '#C9A96E' : 'rgba(245,239,224,0.4)' }}
                    >
                      {friendAdded ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      )}
                      <span className="font-sans text-[9px] tracking-wider uppercase">{friendAdded ? 'Added' : 'Add'}</span>
                    </button>
                  )}
                </div>
                {pinnedEntry.username && (
                  <p className="font-sans text-cream/30 text-xs">@{pinnedEntry.username}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-sans text-[9px] tracking-[0.2em] uppercase font-semibold" style={{ color: '#C9A96E' }}>Top Larper</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(201,169,110,0.10)', border: '1px solid rgba(201,169,110,0.18)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-champagne/50 animate-pulse" />
                  <span className="font-sans text-[10px] text-champagne/50">
                    <Countdown expiresAt={pinnedEntry.pin_expires_at!} />
                  </span>
                </div>
                <p className="font-sans text-[9px] text-cream/15 mt-1 tracking-widest uppercase">Pinned</p>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setPinModal(true)}
            className="w-full rounded-2xl p-5 mb-5 text-left relative overflow-hidden group transition-all duration-200 hover:scale-[1.005]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 0%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.18)' }}>
                <CrownIcon className="text-champagne/55" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-cream text-base font-semibold">Larp the #1 Spot</p>
                <p className="font-sans text-cream/50 text-xs mt-0.5">
                  Pin yourself at the top for 1 hour
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-serif text-champagne text-xl font-semibold"><span className="text-sm align-top mt-0.5 inline-block">$</span>9.99</p>
                <p className="font-sans text-[9px] text-cream/40 tracking-widest uppercase">per hour</p>
              </div>
            </div>
          </button>
        )}

        {/* Search */}
        <div className="relative mb-4" ref={searchRef}>
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/25 pointer-events-none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a larper…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-champagne/20 border-t-champagne/60 rounded-full animate-spin" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 shadow-modal"
              style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
              {searchResults.map(r => (
                <Link key={r.id} href={`/u/${r.id}`}
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0">
                  <span className="font-sans text-xs text-cream/30 w-7 text-right shrink-0">#{r.rank}</span>
                  <Avatar name={r.name} image={r.avatar_url} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-cream/80 truncate">{r.name ?? 'Member'}</p>
                    {r.username && <p className="font-sans text-[11px] text-cream/30">@{r.username}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-champagne text-sm font-semibold">{r.score}</p>
                    <p className="font-sans text-[9px] text-cream/20 uppercase tracking-wider">pts</p>
                  </div>
                  {r.tier !== 'none' && <TierBadge tier={r.tier} size="sm" />}
                </Link>
              ))}
            </div>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-4 text-center z-20"
              style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="font-sans text-xs text-cream/25">No larpers found</p>
            </div>
          )}
        </div>

        {/* Leaderboard table */}
        <div className="rounded-2xl overflow-hidden mb-5"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border border-champagne/20 border-t-champagne/60 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-cream/20 text-xl mb-2">No players yet</p>
              <p className="font-sans text-cream/12 text-xs">Complete challenges to earn XP and enter the rankings</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const isMe = session?.user?.id === entry.id;
              return (
                <div key={`${entry.id}-${entry.rank}`}
                  className={`flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-3.5 sm:py-4 transition-colors ${
                    isMe ? 'bg-champagne/[0.055]' : 'hover:bg-white/[0.02]'
                  } ${i < entries.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                  <RankBadge rank={entry.rank} />
                  <Link href={`/u/${entry.id}`} className="shrink-0">
                    <Avatar name={entry.name} image={entry.avatar_url} size={34} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/u/${entry.id}`}
                        className="font-serif text-cream/90 text-sm font-semibold hover:text-champagne transition-colors truncate max-w-[130px] sm:max-w-none">
                        {entry.name ?? 'Member'}
                      </Link>
                      {isMe && (
                        <span className="font-sans text-[8px] text-champagne/40 tracking-[0.2em] uppercase">You</span>
                      )}
                      {entry.tier !== 'none' && <TierBadge tier={entry.tier} size="sm" />}
                    </div>
                    {entry.username && (
                      <p className="font-sans text-cream/25 text-[11px]">@{entry.username}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-champagne text-lg sm:text-xl font-semibold leading-none">{entry.score}</p>
                    <p className="font-sans text-[9px] text-cream/18 tracking-widest uppercase mt-0.5 hidden sm:block">pts</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Not in top 100 nudge */}
        {!loading && myEntry === null && session?.user?.id && (
          <div className="rounded-xl px-5 py-3 text-center mb-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-sans text-xs text-cream/25">
              You&apos;re not in the top 100 yet. Complete challenges to earn XP and climb the board.
            </p>
          </div>
        )}

        {/* Tier guide */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-champagne/50 mb-1">How It Works</p>
          <p className="font-sans text-xs text-cream/55 leading-relaxed mb-5">
            Your score = XP earned from completing challenges. Tiers unlock as you grow, and a badge appears on your profile.
          </p>
          <div className="space-y-2.5">
            {TIER_GUIDE.map(({ tier, min, max }) => {
              const meta = TIER_META[tier];
              return (
                <div key={tier} className="flex items-center gap-3">
                  <TierBadge tier={tier} size="sm" showLabel={false} />
                  <span className="font-sans text-xs capitalize" style={{ color: meta.color }}>{meta.label}</span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${meta.border}, transparent)` }} />
                  <span className="font-sans text-[10px] text-cream/20 tabular-nums">
                    {max ? `${min} – ${max} pts` : `${min}+ pts`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="font-sans text-xs text-cream/15 hover:text-cream/35 tracking-widest uppercase transition-colors">
            Where To LARP
          </Link>
        </div>
      </div>

      {pinModal && <PinModal onClose={() => setPinModal(false)} onPinned={fetchLeaderboard} />}
    </div>
  );
}
