'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown for the Swatch × Audemars Piguet drop.
 * The drop happens at 10:00 local time in each region — same wall clock,
 * different absolute moments — so we keep two separate target timestamps.
 *
 * Remove this component (and its mount in <Hero />) after the drop is over.
 */
const DROP_BST_UTC = Date.UTC(2026, 4, 16, 9, 0, 0);   // 10:00 BST → 09:00 UTC
const DROP_EDT_UTC = Date.UTC(2026, 4, 16, 14, 0, 0);  // 10:00 EDT → 14:00 UTC

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
  isLive: boolean;
}

const PLACEHOLDER: Parts = { d: 0, h: 0, m: 0, s: 0, isLive: false };

function diff(target: number, now: number): Parts {
  const ms = Math.max(0, target - now);
  const totalSec = Math.floor(ms / 1000);
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    isLive: ms === 0,
  };
}

export default function DropCountdown() {
  // Initialize null on the server so SSR markup is stable; fill in on mount.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ready = now !== null;
  const bst = ready ? diff(DROP_BST_UTC, now!) : PLACEHOLDER;
  const edt = ready ? diff(DROP_EDT_UTC, now!) : PLACEHOLDER;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-sans text-champagne text-[10px] tracking-[0.35em] uppercase mb-2">
        Swatch × Audemars Piguet · Drops 16 May, 10:00
      </p>
      {/* Stack regions vertically on phones (more breathing room),
          side-by-side from sm: up. */}
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-2.5 sm:gap-7">
        <Region label="London · BST" t={bst} ready={ready} />
        <div className="h-px w-12 sm:h-auto sm:w-px bg-champagne/15" />
        <Region label="New York · EDT" t={edt} ready={ready} />
      </div>
    </div>
  );
}

function Region({ label, t, ready }: { label: string; t: Parts; ready: boolean }) {
  return (
    <div>
      <p className="font-sans text-cream/40 text-[9px] tracking-[0.25em] uppercase mb-1">
        {label}
      </p>
      {ready && t.isLive ? (
        <p className="font-serif text-champagne text-base font-semibold animate-pulse">
          Live now
        </p>
      ) : (
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Cell n={t.d} u="d" ready={ready} />
          <Sep />
          <Cell n={t.h} u="h" ready={ready} />
          <Sep />
          <Cell n={t.m} u="m" ready={ready} />
          <Sep />
          <Cell n={t.s} u="s" ready={ready} />
        </div>
      )}
    </div>
  );
}

function Cell({ n, u, ready }: { n: number; u: string; ready: boolean }) {
  return (
    <span className="inline-flex items-baseline">
      <span className="font-serif text-cream text-base sm:text-lg font-semibold tabular-nums">
        {ready ? n.toString().padStart(2, '0') : '—'}
      </span>
      <span className="font-sans text-cream/30 text-[9px] ml-0.5">{u}</span>
    </span>
  );
}

function Sep() {
  return <span className="text-champagne/30 text-xs leading-none">:</span>;
}
