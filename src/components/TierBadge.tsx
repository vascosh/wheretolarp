'use client';

import { TIER_META, type Tier } from '@/lib/tiers';

interface Props {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/* Tier colours read as *metals*, not brand palette — a Gold tier badge that
   renders blue is just confusing. Deliberately exempt from the Swiss Blue
   repalette. All AA-safe on white paper.
   (TIER_META keeps the legacy colours for pages not yet rethemed.) */
export const TIER_HERITAGE: Record<Exclude<Tier, 'none'>, { color: string; bg: string; border: string }> = {
  bronze:   { color: '#8C5A2B', bg: 'rgba(140,90,43,0.10)',  border: 'rgba(140,90,43,0.35)'  },
  silver:   { color: '#64676E', bg: 'rgba(100,103,110,0.10)', border: 'rgba(100,103,110,0.35)' },
  gold:     { color: '#86691A', bg: 'rgba(134,105,26,0.10)', border: 'rgba(134,105,26,0.35)' },
  platinum: { color: '#5B6470', bg: 'rgba(91,100,112,0.10)', border: 'rgba(91,100,112,0.35)' },
  diamond:  { color: '#157A8C', bg: 'rgba(21,122,140,0.10)', border: 'rgba(21,122,140,0.35)' },
};

function TierIcon({ tier, px }: { tier: Exclude<Tier, 'none'>; px: number }) {
  switch (tier) {
    case 'bronze':
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 8v8l10 5 10-5V8L12 3z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'silver':
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 8v8l10 5 10-5V8L12 3z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill="currentColor" fillOpacity="0.22" />
          <path d="M12 8v8M8 10.5l4 2 4-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'gold':
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.9 6.3 7.1.6-5.3 4.8 1.6 6.9L12 17.3l-6.3 3.3 1.6-6.9L2 8.9l7.1-.6L12 2z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill="currentColor" fillOpacity="0.35" />
        </svg>
      );
    case 'platinum':
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.9 6.3 7.1.6-5.3 4.8 1.6 6.9L12 17.3l-6.3 3.3 1.6-6.9L2 8.9l7.1-.6L12 2z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill="currentColor" fillOpacity="0.28" />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.2"
            fill="currentColor" fillOpacity="0.5" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <path d="M6 3h12l4 6-10 13L2 9l4-6z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill="currentColor" fillOpacity="0.22" />
          <path d="M2 9h20M6 3l4 6M18 3l-4 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function TierBadge({ tier, size = 'md', showLabel = true }: Props) {
  if (tier === 'none') return null;
  const meta = TIER_META[tier];
  const heritage = TIER_HERITAGE[tier];

  const iconPx  = size === 'sm' ? 11 : size === 'md' ? 14 : 18;
  const textCls = size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-[10px]' : 'text-[11px]';
  const padCls  = size === 'sm' ? 'px-2 py-0.5 gap-1.5' : size === 'md' ? 'px-2.5 py-1 gap-2' : 'px-3.5 py-1.5 gap-2.5';

  return (
    <span
      className={`inline-flex items-center font-sans tracking-[0.25em] uppercase font-medium ${padCls} ${textCls}`}
      style={{
        color: heritage.color,
        background: heritage.bg,
        border: `1px solid ${heritage.border}`,
      }}
    >
      <TierIcon tier={tier} px={iconPx} />
      {showLabel && meta.label}
    </span>
  );
}
