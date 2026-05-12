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
}

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
      <div className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-modal animate-modal-enter flex flex-col max-h-[90vh]"
        style={{ background: '#0e1e32' }}>

        {/* Gradient header */}
        <div className={clsx('relative bg-gradient-to-br px-7 py-7 shrink-0', theme.header)}>
          <button onClick={onClose}
            className="absolute top-4 right-4 text-cream/30 hover:text-cream transition-colors p-1 rounded-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.15em] uppercase mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: theme.label }}>
            {location.category}
          </span>
          <h2 className="font-serif text-cream text-2xl font-semibold leading-snug pr-8">{location.name}</h2>
          <p className="font-sans text-xs mt-1.5 opacity-60" style={{ color: theme.label }}>{location.neighborhood}</p>
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

export default function LocationCard({ location, isSelected, onSelect }: LocationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = categoryColors[location.category] ?? DEFAULT_THEME;

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={clsx(
          'card-location border flex flex-col group hover:-translate-y-1',
          isSelected
            ? 'border-champagne ring-1 ring-champagne shadow-card-hover'
            : 'border-transparent hover:border-champagne/20'
        )}
      >
        {/* Colored header block */}
        <div className={clsx('relative bg-gradient-to-br px-5 py-5 flex items-end justify-between', theme.header)}
          style={{ minHeight: '90px' }}>
          <div className="relative z-10">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase leading-none mb-2 opacity-60"
              style={{ color: theme.label }}>
              {location.neighborhood}
            </p>
            <h3 className="font-serif text-cream text-xl font-semibold leading-snug group-hover:text-champagne transition-colors duration-300">
              {location.name}
            </h3>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="category-badge text-[10px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: theme.label }}>
              {location.category}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <VibeDifficulty level={location.vibe_difficulty} />
            {location.address && (
              <p className="font-sans text-[10px] text-muted truncate max-w-[160px]">{location.address}</p>
            )}
          </div>
          <p className="font-sans text-sm text-charcoal/80 leading-relaxed mb-3 line-clamp-3">
            {location.description}
          </p>
          <span className="font-sans text-[10px] text-champagne/60 tracking-widest uppercase flex items-center gap-1">
            View details
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* What to Wear */}
        <div onClick={e => e.stopPropagation()}>
          <WhatToWear data={location.what_to_wear} spotName={location.name} />
        </div>

        {/* LARP Together */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4" onClick={e => e.stopPropagation()}>
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
