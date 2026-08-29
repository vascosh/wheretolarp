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

export default function InviteClient({ token, plan, inviter, status, isLoggedIn, isOwnInvite }: InviteClientProps) {
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(status === 'accepted');
  const [error, setError] = useState('');

  async function handleAccept() {
    setAccepting(true);
    setError('');
    try {
      const res = await fetch(`/api/invites/${token}`, { method: 'PATCH' });
      if (res.ok) {
        setAccepted(true);
      } else {
        const d = await res.json();
        setError(d.error ?? 'The acceptance did not go through. Try again.');
      }
    } catch {
      setError('The wire failed. Try again.');
    } finally {
      setAccepting(false);
    }
  }

  const dateStr = plan.plan_date
    ? new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen pt-nav flex items-center justify-center bg-parchment px-4 text-peat">
      <div className="relative w-full max-w-md py-16">
        {/* The summons — framed like a printed invitation */}
        <div className="plate-frame animate-scale-in shadow-[0_2px_24px_rgba(16, 17, 20,0.07)]">
          {/* Header */}
          <div className="px-8 pt-10 pb-7 text-center border-b border-forest/15">
            <p className="eyebrow mb-5 flex items-center justify-center gap-3">
              <span className="inline-block h-px w-8 bg-gold/50" />
              An Invitation · The Society
              <span className="inline-block h-px w-8 bg-gold/50" />
            </p>
            <h1 className="headline-editorial text-3xl sm:text-4xl mb-4">
              {plan.spot_name}
            </h1>
            <p className="font-display italic text-gold-dark text-base">
              by {inviter.name}
            </p>
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold-dark/60 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-peat/75">{dateStr}</span>
            </div>

            {plan.plan_time && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold-dark/60 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-peat/75">{formatTime(plan.plan_time)}</span>
              </div>
            )}

            {plan.spot_neighborhood && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold-dark/60 shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="font-sans text-sm text-peat/75">{plan.spot_neighborhood}</span>
              </div>
            )}

            {plan.spot_category && (
              <span className="inline-block rounded-full border border-forest/25 bg-forest-pale px-3 py-1 font-sans text-[9px] tracking-[0.12em] uppercase text-forest">
                {plan.spot_category}
              </span>
            )}

            {plan.spot_description && (
              <p className="font-sans text-xs text-peat/55 leading-relaxed pt-2 border-t border-forest/10">
                {plan.spot_description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 pt-2">
            {accepted ? (
              <div className="text-center space-y-5">
                <div className="w-14 h-14 rounded-full border border-gold/50 bg-gold/10 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-forest">
                    <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="headline-editorial text-2xl mb-2">You&apos;re <em className="italic text-gold-dark">in</em>.</p>
                  <p className="font-sans text-peat/55 text-xs">The engagement is recorded in your calendar.</p>
                </div>
                <Link href="/profile" className="btn-editorial">
                  View My Profile
                </Link>
              </div>
            ) : isOwnInvite ? (
              <p className="font-sans text-sm text-peat/60 text-center leading-relaxed">This is your own invitation. Circulate it among friends.</p>
            ) : isLoggedIn ? (
              <div className="space-y-3">
                <button onClick={handleAccept} disabled={accepting}
                  className="btn-editorial w-full disabled:opacity-50">
                  {accepting ? 'Joining…' : 'Accept & Join'}
                </button>
                {error && <p className="font-sans text-xs text-burgundy text-center">{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-sans text-xs text-peat/60 text-center mb-4 leading-relaxed">
                  The Society must know you before you may accept. Your character awaits.
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
