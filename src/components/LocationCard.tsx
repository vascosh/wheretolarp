'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Location } from '@/lib/types';
import WhatToWear from './WhatToWear';
import LARPTogether from './LARPTogether';
import clsx from 'clsx';

interface LocationCardProps {
  location: Location;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** Catalogue position — shown as a hanging numeral. */
  index?: number;
  /** Accent colour for contextual hairlines/labels (aged gold by default). */
  accent?: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function VibeDifficulty({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1" title={`Vibe difficulty: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={clsx('text-[10px]', i < level ? 'text-gold' : 'text-peat/15')}>
          &#9670;
        </span>
      ))}
    </div>
  );
}

/* ── Location Detail Modal — a leaf from the register ── */
function LocationDetailModal({ location, onClose }: { location: Location; onClose: () => void }) {
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
      <div className="absolute inset-0 bg-forest/60 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[18px] border border-gold/30 bg-parchment-light shadow-modal animate-modal-enter flex flex-col max-h-[90vh]">

        {/* Editorial header */}
        <div className="relative bg-parchment px-7 py-8 shrink-0 border-b border-gold/20">
          <span className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-gold to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 right-4 text-peat/35 hover:text-gold-dark transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase mb-3 text-gold-dark">
            {location.neighborhood}
          </p>
          <h2 className="headline-editorial text-3xl sm:text-4xl pr-8">{location.name}</h2>
          <span className="inline-block mt-4 font-sans text-[9px] tracking-[0.2em] uppercase text-peat/55 border border-gold/30 px-2.5 py-1">
            {location.category}
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-7 py-5 sm:py-6 space-y-5">

          {/* Address */}
          {(location.address || location.latitude) && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gold/60 shrink-0 mt-0.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="font-sans text-sm text-peat/75">
                  {location.address ?? `${location.neighborhood}`}
                </span>
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="shrink-0 px-3 py-1.5 rounded-full border border-peat/15 text-peat/50 font-sans text-[10px] tracking-widest uppercase hover:border-gold/50 hover:text-gold-dark transition-all whitespace-nowrap">
                Maps ↗
              </a>
            </div>
          )}

          {/* Vibe difficulty */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40 mb-2">Vibe Level</p>
            <VibeDifficulty level={location.vibe_difficulty} />
          </div>

          {/* Description */}
          {location.description && (
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40 mb-2">About</p>
              <p className="font-sans text-sm text-peat/75 leading-relaxed">{location.description}</p>
            </div>
          )}

          {/* LARP Together */}
          <div className="border-t border-peat/10 pt-4">
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

export default function LocationCard({ location, isSelected, onSelect, index, accent = '#4B5DF0' }: LocationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const numeral = typeof index === 'number' ? (ROMAN[index] ?? String(index + 1)) : null;

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={clsx(
          'relative flex flex-col group cursor-pointer overflow-hidden rounded-[18px] bg-parchment-light transition-all duration-500 border',
          isSelected
            ? 'border-gold shadow-[0_8px_40px_rgba(16, 17, 20,0.12)]'
            : 'border-peat/10 shadow-[0_2px_24px_rgba(16, 17, 20,0.07)] hover:border-gold/40 hover:shadow-[0_8px_40px_rgba(16, 17, 20,0.10)]'
        )}
      >
        {/* top hairline accent */}
        <span className="absolute top-0 left-0 h-px w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 70%)` }} />

        {/* Header — eyebrow neighborhood, numeral, big serif name */}
        <div className="px-5 sm:px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold-dark">
              {location.neighborhood}
            </p>
            {numeral && <span className="numeral text-xs shrink-0">{numeral}</span>}
          </div>
          <h3 className="font-display text-forest text-2xl sm:text-3xl leading-[1.05] group-hover:text-gold-dark transition-colors duration-300">
            {location.name}
          </h3>
          <span
            className="inline-block mt-3 font-sans text-[9px] tracking-[0.2em] uppercase text-peat/50 border border-gold/30 px-2.5 py-1"
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
              <p className="font-sans text-[10px] text-peat/45 truncate max-w-[160px]">{location.address}</p>
            )}
          </div>
          <p className="font-sans text-sm text-peat/75 leading-relaxed mb-4 line-clamp-3">
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
