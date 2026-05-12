export type Tier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierMeta {
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  min: number;
  next: number | null;
}

export const TIER_META: Record<Exclude<Tier, 'none'>, TierMeta> = {
  bronze: {
    label: 'Bronze',
    color: '#C8834A',
    glow: 'rgba(200,131,74,0.35)',
    bg: 'rgba(200,131,74,0.12)',
    border: 'rgba(200,131,74,0.28)',
    min: 1,
    next: 300,
  },
  silver: {
    label: 'Silver',
    color: '#B0B8C8',
    glow: 'rgba(176,184,200,0.30)',
    bg: 'rgba(176,184,200,0.10)',
    border: 'rgba(176,184,200,0.24)',
    min: 300,
    next: 600,
  },
  gold: {
    label: 'Gold',
    color: '#C9A96E',
    glow: 'rgba(201,169,110,0.40)',
    bg: 'rgba(201,169,110,0.14)',
    border: 'rgba(201,169,110,0.30)',
    min: 600,
    next: 900,
  },
  platinum: {
    label: 'Platinum',
    color: '#D4D8F0',
    glow: 'rgba(212,216,240,0.30)',
    bg: 'rgba(212,216,240,0.09)',
    border: 'rgba(212,216,240,0.20)',
    min: 900,
    next: 1500,
  },
  diamond: {
    label: 'Diamond',
    color: '#88F0FF',
    glow: 'rgba(136,240,255,0.40)',
    bg: 'rgba(136,240,255,0.10)',
    border: 'rgba(136,240,255,0.22)',
    min: 1500,
    next: null,
  },
};

export function getTier(score: number): Tier {
  if (score >= 1500) return 'diamond';
  if (score >= 900)  return 'platinum';
  if (score >= 600)  return 'gold';
  if (score >= 300)  return 'silver';
  if (score > 0)     return 'bronze';
  return 'none';
}

// Kept for any legacy callers — now score IS the XP directly
export function getScore(xp: number): number {
  return xp;
}
