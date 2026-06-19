'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Location, Category } from '@/lib/types';
import WhatToWear from './WhatToWear';
import LARPTogether from './LARPTogether';
import clsx from 'clsx';

interface LocationCardProps {
  location: Location;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** Catalogue position — shown as a hanging numeral. */
  index?: number;
  /** City accent colour for contextual hairlines/labels. */
  accent?: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const DEFAULT_THEME = { badge: 'bg-[#1a3a5c] text-[#a8c8e8]', header: 'from-[#0e2844] via-[#1a3a5c] to-[#0a1e38]', label: '#a8c8e8' };

const categoryColors: Record<string, { badge: string; header: string; label: string }> = {
  'Old Money':          { badge: 'bg-[#1a3a5c] text-[#a8c8e8]', header: 'from-[#0e2844] via-[#1a3a5c] to-[#0a1e38]', label: '#a8c8e8' },
  'Intellectual':       { badge: 'bg-[#2a2a1a] text-[#c8c07a]', header: 'from-[#2a2a1a] via-[#363624] to-[#202014]', label: '#c8c07a' },
  'Art World':          { badge: 'bg-[#3a1a2a] text-[#d4a0b8]', header: 'from-[#3a1a2a] via-[#4a2238] to-[#2e1422]', label: '#d4a0b8' },
  'Continental':        { badge: 'bg-[#1a2a3a] text-[#90b8d8]', header: 'from-[#1a2a3a] via-[#1e3448] to-[#142230]', label: '#90b8d8' },
  'Luxury Retail':      { badge: 'bg-[#2a1a0a] text-[#d4a870]', header: 'from-[#2a1a0a] via-[#3a2410] to-[#1e1208]', label: '#d4a870' },
  'Power Lunch':        { badge: 'bg-[#1a3a2a] text-[#90c8a8]', header: 'from-[#1a3a2a] via-[#224a34] to-[#122a1e]', label: '#90c8a8' },
  'Weekend Aristocrat': { badge: 'bg-[#2a2438] text-[#b8a8d8]', header: 'from-[#2a2438] via-[#352e48] to-[#1e1a2c]', label: '#b8a8d8' },
  'Hotel Lobby':        { badge: 'bg-[#2a1a35] text-[#c8a8e8]', header: 'from-[#2a1a35] via-[#352244] to-[#20142a]', label: '#c8a8e8' },
  'Rooftop Bar':        { badge: 'bg-[#1a2a1a] text-[#a8d4a0]', header: 'from-[#1a2a1a] via-[#223822] to-[#142014]', label: '#a8d4a0' },
};

function VibeDifficulty({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1" title={`Vibe difficulty: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={clsx('text-[10px]', i < level ? 'text-champagne' : 'text-charcoal/15')}>
          &#9670;
        </span>
      ))}
    </div>
  );
}

/* ── Location Detail Modal ── */
function LocationDetailModal({ location, onClose }: { location: Location; onClose: () => void }) {
  const theme = categoryColors[location.category] ?? DEFAULT_THEME;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const mapsUrl = location.address
    ? `https://maps.google.com/?q=${encodeURIComponent(location.address)}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${location.name} ${location.neighborhood}`)}`;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-navy/75 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden shadow-modal animate-modal-enter flex flex-col max-h-[90vh] border border-champagne/20"
        style={{ background: '#060D18' }}>

        {/* Editorial header */}
        <div className="relative bg-ink px-7 py-8 shrink-0 border-b border-champagne/15">
          <span className="absolute top-0 left-0 h-px w-full" style={{ background: `linear-gradient(90deg, ${theme.label}, transparent 70%)` }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 text-cream/30 hover:text-champagne transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: theme.label }}>
            {location.neighborhood}
          </p>
          <h2 className="headline-editorial text-cream text-3xl sm:text-4xl pr-8">{location.name}</h2>
          <span className="inline-block mt-4 font-sans text-[9px] tracking-[0.2em] uppercase text-cream/45 border border-champagne/25 px-2.5 py-1">
            {location.category}
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-7 py-5 sm:py-6 space-y-5">

          {/* Address */}
          {(location.address || location.latitude) && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0 mt-0.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="font-sans text-sm text-cream/70">
                  {location.address ?? `${location.neighborhood}`}
                </span>
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="shrink-0 px-3 py-1.5 rounded-full border border-white/[0.08] text-cream/40 font-sans text-[10px] tracking-widest uppercase hover:border-champagne/30 hover:text-champagne transition-all whitespace-nowrap">
                Maps ↗
              </a>
            </div>
          )}

          {/* Vibe difficulty */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-2">Vibe Level</p>
            <VibeDifficulty level={location.vibe_difficulty} />
          </div>

          {/* Description */}
          {location.description && (
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-2">About</p>
              <p className="font-sans text-sm text-cream/70 leading-relaxed">{location.description}</p>
            </div>
          )}

          {/* LARP Together */}
          <div className="border-t border-white/[0.06] pt-4">
            <LARPTogether
              name={location.name}
              neighborhood={location.neighborhood}
              description={location.description}
              category={location.category}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LocationCard({ location, isSelected, onSelect, index, accent = '#C9A96E' }: LocationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = categoryColors[location.category] ?? DEFAULT_THEME;

  useEffect(() => { setMounted(true); }, []);

  const numeral = typeof index === 'number' ? (ROMAN[index] ?? String(index + 1)) : null;

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={clsx(
          'relative flex flex-col group cursor-pointer bg-cream transition-all duration-500 border',
          isSelected
            ? 'border-champagne shadow-[0_8px_40px_rgba(10,22,40,0.10)]'
            : 'border-champagne/20 hover:border-champagne/50 hover:shadow-[0_8px_40px_rgba(10,22,40,0.08)]'
        )}
      >
        {/* top hairline accent (city colour) */}
        <span className="absolute top-0 left-0 h-px w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 70%)` }} />

        {/* Header — eyebrow neighborhood, numeral, big serif name */}
        <div className="px-5 sm:px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              {location.neighborhood}
            </p>
            {numeral && <span className="numeral text-xs shrink-0">{numeral}</span>}
          </div>
          <h3 className="font-display text-navy text-2xl sm:text-3xl leading-[1.05] group-hover:text-champagne-dark transition-colors duration-300">
            {location.name}
          </h3>
          <span
            className="inline-block mt-3 font-sans text-[9px] tracking-[0.2em] uppercase text-charcoal/45 border border-champagne/25 px-2.5 py-1"
          >
            {location.category}
          </span>
        </div>

        <div className="rule-champagne-dim mx-5 sm:mx-6" />

        {/* Content */}
        <div className="px-5 sm:px-6 py-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <VibeDifficulty level={location.vibe_difficulty} />
            {location.address && (
              <p className="font-sans text-[10px] text-muted truncate max-w-[160px]">{location.address}</p>
            )}
          </div>
          <p className="font-sans text-sm text-charcoal/75 leading-relaxed mb-4 line-clamp-3">
            {location.description}
          </p>
          <span className="link-underline">
            View details <span aria-hidden>→</span>
          </span>
        </div>

        {/* What to Wear */}
        <div onClick={e => e.stopPropagation()}>
          <WhatToWear data={location.what_to_wear} spotName={location.name} />
        </div>

        {/* LARP Together */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5" onClick={e => e.stopPropagation()}>
          <LARPTogether
            name={location.name}
            neighborhood={location.neighborhood}
            description={location.description}
            category={location.category}
          />
        </div>
      </div>

      {mounted && detailOpen && (
        <LocationDetailModal location={location} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
