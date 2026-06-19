'use client';

import { useState } from 'react';
import Link from 'next/link';

interface InviteClientProps {
  token: string;
  plan: {
    spot_name: string;
    spot_neighborhood: string | null;
    spot_category: string | null;
    spot_description: string | null;
    plan_date: string;
    plan_time: string | null;
  };
  inviter: { name: string; avatar_url: string | null };
  status: string;
  isLoggedIn: boolean;
  isOwnInvite: boolean;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''} ${p}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Old Money': '#a8c8e8', 'Intellectual': '#c8c07a', 'Art World': '#d4a0b8',
  'Continental': '#90b8d8', 'Luxury Retail': '#d4a870', 'Power Lunch': '#90c8a8',
  'Weekend Aristocrat': '#b8a8d8', 'Hotel Lobby': '#c8a8e8', 'Rooftop Bar': '#a8d4a0',
  'Art & Galleries': '#d4a0b8', 'Dining & Nightlife': '#90b8d8', 'Hotel Bars & Lounges': '#c8a8e8',
  'Cultural': '#c8c07a', 'Members Clubs': '#a8c8e8', 'Rooftop & Outdoor': '#a8d4a0',
};

export default function InviteClient({ token, plan, inviter, status, isLoggedIn, isOwnInvite }: InviteClientProps) {
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(status === 'accepted');
  const [error, setError] = useState('');

  const labelColor = plan.spot_category ? (CATEGORY_COLORS[plan.spot_category] ?? '#a8c8e8') : '#C9A96E';

  async function handleAccept() {
    setAccepting(true);
    setError('');
    try {
      const res = await fetch(`/api/invites/${token}`, { method: 'PATCH' });
      if (res.ok) {
        setAccepted(true);
      } else {
        const d = await res.json();
        setError(d.error ?? 'Failed to accept invite.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setAccepting(false);
    }
  }

  const dateStr = plan.plan_date
    ? new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen pt-nav flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,169,110,0.06) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden animate-scale-in"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(201,169,110,0.22)', backdropFilter: 'blur(24px)' }}>
          <div className="rule-champagne-dim" />

          {/* Header */}
          <div className="px-8 pt-10 pb-7 text-center border-b border-champagne/15">
            <p className="eyebrow mb-5 flex items-center justify-center gap-3">
              <span className="inline-block h-px w-8 bg-champagne/50" />
              You&apos;re invited
              <span className="inline-block h-px w-8 bg-champagne/50" />
            </p>
            <h1 className="headline-editorial text-cream text-3xl sm:text-4xl mb-4">
              {plan.spot_name}
            </h1>
            <p className="font-display italic text-champagne/60 text-base">
              by {inviter.name}
            </p>
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-cream/70">{dateStr}</span>
            </div>

            {plan.plan_time && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-cream/70">{formatTime(plan.plan_time)}</span>
              </div>
            )}

            {plan.spot_neighborhood && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="font-sans text-sm text-cream/70">{plan.spot_neighborhood}</span>
              </div>
            )}

            {plan.spot_category && (
              <span className="inline-block font-sans text-[9px] tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: `${labelColor}15`, color: labelColor, border: `1px solid ${labelColor}25` }}>
                {plan.spot_category}
              </span>
            )}

            {plan.spot_description && (
              <p className="font-sans text-xs text-cream/30 leading-relaxed pt-2 border-t border-white/[0.05]">
                {plan.spot_description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 pt-2">
            {accepted ? (
              <div className="text-center space-y-5">
                <div className="w-14 h-14 rounded-full border border-champagne/40 bg-champagne/10 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-champagne">
                    <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="headline-editorial text-cream text-2xl mb-2">You&apos;re <span className="italic text-champagne">in</span>.</p>
                  <p className="font-sans text-cream/40 text-xs">This plan has been added to your calendar.</p>
                </div>
                <Link href="/profile" className="btn-editorial">
                  View My Profile
                </Link>
              </div>
            ) : isOwnInvite ? (
              <p className="font-sans text-sm text-cream/45 text-center leading-relaxed">This is your own invite link. Share it with friends.</p>
            ) : isLoggedIn ? (
              <div className="space-y-3">
                <button onClick={handleAccept} disabled={accepting}
                  className="btn-editorial w-full disabled:opacity-50">
                  {accepting ? 'Joining…' : 'Accept & Join'}
                </button>
                {error && <p className="font-sans text-xs text-red-400/70 text-center">{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-sans text-xs text-cream/45 text-center mb-4 leading-relaxed">
                  You need an account to accept this invite.
                </p>
                <Link
                  href={`/auth/signup?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                  className="btn-editorial w-full">
                  Create Account
                </Link>
                <Link
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                  className="btn-editorial-ghost w-full">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
