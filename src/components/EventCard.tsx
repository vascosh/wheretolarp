'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Event } from '@/lib/types';
import LARPTogether from './LARPTogether';
import clsx from 'clsx';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  'Art & Galleries': {
    bg: 'bg-[#3a1a2a]',
    text: 'text-[#d4a0b8]',
    gradient: 'from-[#3a1a2a] via-[#4a2238] to-[#2e1422]',
  },
  'Dining & Nightlife': {
    bg: 'bg-[#1a2a3a]',
    text: 'text-[#90b8d8]',
    gradient: 'from-[#1a2a3a] via-[#1e3448] to-[#142230]',
  },
  'Hotel Bars & Lounges': {
    bg: 'bg-[#2a1a35]',
    text: 'text-[#c8a8e8]',
    gradient: 'from-[#2a1a35] via-[#352244] to-[#20142a]',
  },
  'Cultural': {
    bg: 'bg-[#2a2a1a]',
    text: 'text-[#c8c07a]',
    gradient: 'from-[#2a2a1a] via-[#363624] to-[#202014]',
  },
  'Members Clubs': {
    bg: 'bg-[#1a3a5c]',
    text: 'text-[#a8c8e8]',
    gradient: 'from-[#0e2844] via-[#1a3a5c] to-[#0a1e38]',
  },
  'Rooftop & Outdoor': {
    bg: 'bg-[#1a2a1a]',
    text: 'text-[#a8d4a0]',
    gradient: 'from-[#1a2a1a] via-[#223822] to-[#142014]',
  },
};

const DEFAULT_COLORS = {
  bg: 'bg-navy/80',
  text: 'text-champagne',
  gradient: 'from-navy via-navy-light to-navy',
};

function parseDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `${hour}${mins}${period}`;
}

function VibeDifficulty({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Vibe difficulty: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={clsx('text-xs', i < level ? 'text-champagne' : 'text-charcoal/15')}>
          &#9670;
        </span>
      ))}
    </div>
  );
}

/* ── Event Detail Modal ── */
function EventDetailModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { full, weekday } = parseDateParts(event.event_date);
  const colors = CATEGORY_COLORS[event.category] ?? DEFAULT_COLORS;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-navy/75 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-modal animate-modal-enter flex flex-col max-h-[90vh]"
        style={{ background: '#0e1e32' }}>

        {/* Gradient header */}
        <div className={clsx('relative bg-gradient-to-br px-7 py-7 shrink-0', colors.gradient)}>
          <button onClick={onClose}
            className="absolute top-4 right-4 text-cream/30 hover:text-cream transition-colors p-1 rounded-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold tracking-[0.15em] uppercase mb-3', colors.text)}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {event.category}
          </span>
          <h2 className="font-serif text-cream text-2xl font-semibold leading-snug pr-8">{event.title}</h2>
          <p className={clsx('font-sans text-xs mt-1.5 opacity-70', colors.text)}>{event.venue_name}{event.neighborhood ? ` · ${event.neighborhood}` : ''}</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">

          {/* Date & time */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-cream/70">{full}</span>
            </div>
            {event.event_time && (
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-cream/70">{formatTime(event.event_time)}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {event.venue_address && (
            <div className="flex items-start gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0 mt-0.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="font-sans text-sm text-cream/60">{event.venue_address}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-1">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-2">About</p>
              <p className="font-sans text-sm text-cream/70 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-5 pt-1">
            {event.price_range && (
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-1">Price</p>
                <p className="font-sans text-sm text-cream/70">{event.price_range}</p>
              </div>
            )}
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-1">Vibe Level</p>
              <VibeDifficulty level={event.vibe_difficulty} />
            </div>
          </div>

          {/* Ticket link */}
          {event.ticket_url && (
            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-champagne/30 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne hover:text-navy transition-all"
              onClick={e => e.stopPropagation()}>
              Get Tickets
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}

          {/* LARP Together */}
          <div className="border-t border-white/[0.06] pt-4">
            <LARPTogether
              name={event.title}
              neighborhood={event.neighborhood}
              description={event.description}
              category={event.category}
              prefillDate={event.event_date}
              prefillTime={event.event_time ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EventCard({ event }: { event: Event }) {
  const { month, day, weekday } = parseDateParts(event.event_date);
  const colors = CATEGORY_COLORS[event.category] ?? DEFAULT_COLORS;
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className="rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 cursor-pointer group flex flex-col bg-white hover:-translate-y-1"
      >
        {/* Gradient header panel */}
        <div
          className={clsx('relative bg-gradient-to-br px-4 sm:px-6 py-5 sm:py-6 flex items-end justify-between', colors.gradient)}
          style={{ minHeight: '130px' }}
        >
          <div className="relative z-10">
            <p className={clsx('font-sans text-[10px] tracking-[0.25em] uppercase leading-none mb-1.5 opacity-70', colors.text)}>
              {month}
            </p>
            <p className="font-serif text-cream text-[40px] sm:text-[56px] font-semibold leading-none -tracking-[0.02em]">
              {day}
            </p>
          </div>

          <span
            className={clsx('absolute top-3 right-3 sm:top-5 sm:right-5 inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-sans font-semibold tracking-[0.12em] uppercase backdrop-blur-sm', colors.text)}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {event.category}
          </span>

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-navy text-xl font-semibold leading-snug mb-2 group-hover:text-champagne-dark transition-colors duration-300">
            {event.title}
          </h3>

          <p className="font-sans text-[11px] text-muted tracking-[0.12em] uppercase mb-2">
            {event.venue_name}{event.neighborhood ? ` · ${event.neighborhood}` : ''}
          </p>

          {event.event_time && (
            <div className="flex items-center gap-1.5 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/60 shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="font-sans text-xs text-charcoal/60">{weekday} at {formatTime(event.event_time)}</p>
            </div>
          )}

          {event.description && (
            <p className="font-sans text-sm text-charcoal/70 leading-relaxed mb-5 flex-1 line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-cream-dark mt-auto">
            <div className="flex items-center gap-3">
              {event.price_range && (
                <span className="font-sans text-xs text-muted font-medium">{event.price_range}</span>
              )}
              <VibeDifficulty level={event.vibe_difficulty} />
            </div>
            <span className="font-sans text-[10px] text-champagne/60 tracking-widest uppercase flex items-center gap-1">
              View details
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>

        {/* LARP Together */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-cream-dark" onClick={e => e.stopPropagation()}>
          <LARPTogether
            name={event.title}
            neighborhood={event.neighborhood}
            description={event.description}
            category={event.category}
            prefillDate={event.event_date}
            prefillTime={event.event_time ?? undefined}
          />
        </div>
      </div>

      {mounted && detailOpen && (
        <EventDetailModal event={event} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
