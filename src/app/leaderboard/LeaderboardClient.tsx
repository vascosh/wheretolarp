'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TierBadge, { TIER_HERITAGE } from '@/components/TierBadge';
import type { Tier } from '@/lib/tiers';
import { TIER_META } from '@/lib/tiers';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ROMAN = ['I', 'II', 'III'];

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
        className="rounded-full object-cover shrink-0 border border-forest/15" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-forest shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #4B5DF0, #1B2FDE)', fontSize: size * 0.35 }}>
      {initials}
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
      <div className="p-4 border border-forest/15 bg-parchment">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <p className="font-sans text-xs text-burgundy text-center">{error}</p>
      )}
      <button type="submit" disabled={!stripe || loading}
        className="btn-editorial w-full disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Processing…' : 'Pay $9.99'}
      </button>
      <button type="button" onClick={onClose}
        className="w-full py-3 border border-forest/20 text-peat/45 font-sans text-[11px] tracking-[0.25em] uppercase hover:text-forest hover:border-forest/45 transition-all">
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
      <div className="absolute inset-0 bg-forest/40 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm plate-frame shadow-[0_18px_60px_rgba(27, 47, 222,0.25)]">
        <div className="px-5 sm:px-7 py-7 sm:py-9">
          <div className="text-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-5 border border-gold/40 bg-gold/10">
              <CrownIcon className="text-gold-dark" />
            </div>
            <p className="eyebrow mb-3">The Pinned Seat</p>
            <h2 className="headline-editorial text-3xl mb-3">Claim the <span className="italic text-gold-dark">first</span> seat</h2>
            <p className="font-sans text-peat/60 text-sm leading-relaxed">
              Pin yourself at the head of the register for one hour.
            </p>
            <p className="font-display text-gold-dark text-5xl mt-5 mb-1"><span className="text-2xl align-top inline-block">$</span>9.99</p>
            <p className="eyebrow-muted text-[10px]">per hour</p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <p className="font-display italic text-gold-dark text-xl">You&apos;re #1 👑</p>
              <p className="font-sans text-peat/55 text-xs mt-1.5">Your pin is live for the next hour.</p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1B2FDE', colorBackground: '#FFFFFF', colorText: '#101114', borderRadius: '2px' } } }}>
              <CheckoutForm clientSecret={clientSecret} onSuccess={handleSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <div className="space-y-3">
              <button onClick={handleStartPayment}
                className="btn-editorial w-full">
                Purchase · $9.99
              </button>
              <button onClick={onClose}
                className="w-full py-3 border border-forest/20 text-peat/45 font-sans text-[11px] tracking-[0.25em] uppercase hover:text-forest hover:border-forest/45 transition-all">
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
    <div className="min-h-screen pt-nav bg-parchment text-peat">
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

        {/* Chapter-opener header */}
        <header className="mb-12">
          <p className="eyebrow mb-6 flex items-center gap-4">
            <span className="inline-block h-px w-10 bg-gold/50" />
            The Society Papers · Updated Live
          </p>
          <h1 className="headline-editorial text-5xl sm:text-7xl mb-5">
            The <em className="italic text-gold-dark">Standings</em>.
          </h1>
          <p className="font-sans text-peat/65 text-sm sm:text-base leading-relaxed max-w-md">
            Who is topping the city this week. Compete, climb, and LARP your way
            to the head of the ranked register.
          </p>
        </header>

        {/* Tier legend */}
        <div className="mb-10">
          <p className="eyebrow-muted mb-4">The Tiers</p>
          <div className="rule-champagne-dim mb-5" />
          <div className="flex items-center gap-2 flex-wrap">
            {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map(t => (
              <TierBadge key={t} tier={t} size="sm" />
            ))}
          </div>
        </div>

        {/* #1 spot — active pin or CTA */}
        {pinnedEntry ? (
          <div className="plate-frame mb-8">
            <div className="relative p-4 sm:p-6" style={{ background: 'rgba(75, 93, 240,0.06)' }}>
              <p className="eyebrow mb-4 flex items-center gap-2">
                <CrownIcon className="text-gold-dark" /> The Pinned Seat
              </p>
              <div className="flex items-center gap-4">
                <span className="font-display italic text-gold-dark text-3xl sm:text-4xl leading-none shrink-0 w-9 sm:w-12 text-right">I.</span>
                <Avatar name={pinnedEntry.name} image={pinnedEntry.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/u/${pinnedEntry.id}`}
                      className="headline-editorial text-2xl sm:text-3xl hover:text-gold-dark transition-colors">
                      {pinnedEntry.name ?? 'Member'}
                    </Link>
                    {session?.user?.id && session.user.id !== pinnedEntry.id && (
                      <button
                        onClick={() => handleAddPinnedFriend(pinnedEntry.id)}
                        disabled={addingFriend || friendAdded}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-all disabled:opacity-60"
                        style={{ background: friendAdded ? 'rgba(75, 93, 240,0.14)' : 'rgba(27, 47, 222,0.05)', border: '1px solid rgba(27, 47, 222,0.18)', color: friendAdded ? '#1B2FDE' : 'rgba(16, 17, 20,0.55)' }}
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
                    <p className="font-sans text-peat/45 text-xs mt-0.5">@{pinnedEntry.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="eyebrow text-[9px]">Top Larper</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-burgundy/25 bg-burgundy/[0.06]">
                    <div className="w-1.5 h-1.5 rounded-full bg-burgundy/70 animate-pulse" />
                    <span className="font-sans text-[10px] text-burgundy tabular-nums">
                      <Countdown expiresAt={pinnedEntry.pin_expires_at!} />
                    </span>
                  </div>
                  <p className="eyebrow-muted text-[9px] mt-1.5">Pinned</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setPinModal(true)}
            className="plate-frame w-full mb-8 text-left group transition-shadow duration-300 hover:shadow-[0_10px_36px_rgba(27, 47, 222,0.14)]">
            <div className="relative p-4 sm:p-6">
              <p className="eyebrow mb-4 flex items-center gap-2">
                <CrownIcon className="text-gold-dark/70" /> The Pinned Seat · Vacant
              </p>
              <div className="relative flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="headline-editorial text-2xl sm:text-3xl group-hover:text-gold-dark transition-colors">
                    Claim the <span className="italic text-gold-dark">first</span> seat
                  </p>
                  <p className="font-sans text-peat/60 text-xs sm:text-sm mt-1.5">
                    Pin yourself at the head of the register for one hour.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-gold-dark text-2xl sm:text-3xl"><span className="text-base align-top inline-block">$</span>9.99</p>
                  <p className="eyebrow-muted text-[9px]">per hour</p>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Search */}
        <div className="relative mb-4" ref={searchRef}>
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-peat/35 pointer-events-none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search the register…"
              aria-label="Search the register for a larper"
              className="w-full pl-10 pr-4 py-3 font-sans text-sm text-peat placeholder:text-peat/40 tracking-wide bg-parchment-light border border-forest/20 focus:outline-none focus:border-gold transition-all"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-gold/25 border-t-gold-dark rounded-full animate-spin" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-20 bg-parchment-light border border-forest/20 shadow-[0_14px_44px_rgba(27, 47, 222,0.16)]">
              {searchResults.map(r => (
                <Link key={r.id} href={`/u/${r.id}`}
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-parchment transition-colors border-b border-forest/10 last:border-0">
                  <span className="numeral text-xs w-7 text-right shrink-0 tabular-nums">{String(r.rank).padStart(2, '0')}</span>
                  <Avatar name={r.name} image={r.avatar_url} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-forest truncate">{r.name ?? 'Member'}</p>
                    {r.username && <p className="font-sans text-[11px] text-peat/45">@{r.username}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-gold-dark text-base">{r.score}</p>
                    <p className="eyebrow-muted text-[8px]">pts</p>
                  </div>
                  {r.tier !== 'none' && <TierBadge tier={r.tier} size="sm" />}
                </Link>
              ))}
            </div>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 px-4 py-4 text-center z-20 bg-parchment-light border border-forest/20">
              <p className="font-display italic text-peat/45 text-sm">No larpers found</p>
            </div>
          )}
        </div>

        {/* The register */}
        <div className="mb-8">
          {/* column header */}
          <div className="flex items-center gap-2.5 sm:gap-4 px-1 pb-3">
            <span className="eyebrow-muted text-[9px] w-9 sm:w-12 text-right">Rank</span>
            <span className="eyebrow-muted text-[9px] flex-1 pl-[46px]">Larper</span>
            <span className="eyebrow-muted text-[9px]">Score</span>
          </div>
          <div className="rule-champagne mb-1" />

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border border-gold/25 border-t-gold-dark animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center border-b border-forest/15">
              <p className="font-display italic text-peat/45 text-2xl mb-3">The register is blank</p>
              <p className="font-sans text-peat/50 text-xs tracking-wide">File the first entry — complete field exercises to earn XP.</p>
            </div>
          ) : (
            <ul>
              {entries.map((entry) => {
                const isMe = session?.user?.id === entry.id;
                const isTopThree = entry.rank <= 3;

                if (isTopThree) {
                  /* Top three — subtle plate treatment, Roman rank */
                  return (
                    <li key={`${entry.id}-${entry.rank}`} className="py-2 border-b border-forest/10">
                      <div className={`plate-frame transition-shadow duration-300 hover:shadow-[0_10px_36px_rgba(27, 47, 222,0.12)] ${
                        isMe ? 'bg-gold/[0.07]' : ''
                      }`}>
                        <div className="relative flex items-center gap-2.5 sm:gap-4 p-3.5 sm:p-5">
                          <span className="font-display italic text-gold-dark leading-none shrink-0 w-9 sm:w-12 text-right text-2xl sm:text-3xl">
                            {ROMAN[entry.rank - 1]}.
                          </span>
                          <Link href={`/u/${entry.id}`} className="shrink-0">
                            <Avatar name={entry.name} image={entry.avatar_url} size={38} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/u/${entry.id}`}
                                className="headline-editorial text-lg sm:text-2xl hover:text-gold-dark transition-colors truncate max-w-[140px] sm:max-w-none">
                                {entry.name ?? 'Member'}
                              </Link>
                              {isMe && (
                                <span className="eyebrow text-[8px]">You</span>
                              )}
                              {entry.tier !== 'none' && <TierBadge tier={entry.tier} size="sm" />}
                            </div>
                            {entry.username && (
                              <p className="font-sans text-peat/45 text-[11px] mt-0.5">@{entry.username}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display text-gold-dark text-xl sm:text-2xl leading-none">{entry.score}</p>
                            <p className="eyebrow-muted text-[8px] mt-1 hidden sm:block">pts</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }

                /* Rank 4+ — ledger rows with dotted leaders */
                return (
                  <li key={`${entry.id}-${entry.rank}`}
                    className={`border-b border-forest/10 px-1 sm:px-2 py-4 sm:py-5 transition-colors ${
                      isMe ? 'bg-gold/[0.07]' : 'hover:bg-parchment-light'
                    }`}>
                    <div className="ledger-row items-center gap-2.5 sm:gap-4">
                      <span className="numeral text-gold-dark leading-none tabular-nums shrink-0 w-9 sm:w-12 text-right text-base sm:text-xl">
                        {String(entry.rank).padStart(2, '0')}
                      </span>
                      <Link href={`/u/${entry.id}`} className="shrink-0">
                        <Avatar name={entry.name} image={entry.avatar_url} size={34} />
                      </Link>
                      <div className="min-w-0 shrink">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/u/${entry.id}`}
                            className="font-serif text-base sm:text-lg text-forest hover:text-gold-dark transition-colors truncate max-w-[130px] sm:max-w-[220px]">
                            {entry.name ?? 'Member'}
                          </Link>
                          {isMe && (
                            <span className="eyebrow text-[8px]">You</span>
                          )}
                          {entry.tier !== 'none' && <TierBadge tier={entry.tier} size="sm" showLabel={false} />}
                        </div>
                        {entry.username && (
                          <p className="font-sans text-peat/40 text-[11px] mt-0.5">@{entry.username}</p>
                        )}
                      </div>
                      <span className="leader" />
                      <div className="text-right shrink-0">
                        <p className="font-display text-gold-dark text-lg sm:text-xl leading-none tabular-nums">{entry.score}</p>
                        <p className="eyebrow-muted text-[8px] mt-1 hidden sm:block">pts</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Not in top 100 nudge */}
        {!loading && myEntry === null && session?.user?.id && (
          <div className="px-5 py-4 text-center mb-8 card-paper">
            <p className="font-display italic text-peat/60 text-sm">
              You&apos;re not in the top 100 yet — complete field exercises to climb the register.
            </p>
          </div>
        )}

        {/* Tier guide */}
        <div className="p-5 sm:p-6 card-paper">
          <p className="eyebrow mb-3">How It Works</p>
          <p className="font-sans text-xs sm:text-sm text-peat/65 leading-relaxed mb-6">
            Your score is the XP earned from completing field exercises. Tiers unlock as you grow, and a badge appears on your profile.
          </p>
          <div className="rule-champagne-dim mb-5" />
          <div className="space-y-4">
            {TIER_GUIDE.map(({ tier, min, max }) => {
              const meta = TIER_META[tier];
              const heritage = TIER_HERITAGE[tier];
              return (
                <div key={tier} className="flex items-center gap-3">
                  <TierBadge tier={tier} size="sm" showLabel={false} />
                  <span className="font-display text-base capitalize" style={{ color: heritage.color }}>{meta.label}</span>
                  <span className="flex-1 border-b border-dotted border-peat/30 translate-y-[-0.3em]" />
                  <span className="numeral text-[11px] text-gold-dark tabular-nums">
                    {max ? `${min} – ${max} pts` : `${min}+ pts`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <div className="rule-champagne-dim mb-5" />
          <Link href="/" className="eyebrow-muted hover:text-gold-dark transition-colors">
            Where To LARP
          </Link>
        </div>
      </div>

      {pinModal && <PinModal onClose={() => setPinModal(false)} onPinned={fetchLeaderboard} />}
    </div>
  );
}
