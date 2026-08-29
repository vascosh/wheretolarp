'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Event } from '@/lib/types';
import LARPTogether from './LARPTogether';
import clsx from 'clsx';

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
        <span key={i} className={clsx('text-xs', i < level ? 'text-gold' : 'text-peat/15')}>
          &#9670;
        </span>
      ))}
    </div>
  );
}

/* ── Event Detail Modal — a notice from the society papers ── */
function EventDetailModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { full } = parseDateParts(event.event_date);
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
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold-dark mb-3">{event.category}</p>
          <h2 className="headline-editorial text-3xl sm:text-4xl pr-8">{event.title}</h2>
          <p className="font-display italic text-peat/55 text-sm mt-2">{event.venue_name}{event.neighborhood ? ` · ${event.neighborhood}` : ''}</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">

          {/* Date & time */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gold/60 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-peat/75">{full}</span>
            </div>
            {event.event_time && (
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gold/60 shrink-0">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-peat/75">{formatTime(event.event_time)}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {event.venue_address && (
            <div className="flex items-start gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gold/60 shrink-0 mt-0.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="font-sans text-sm text-peat/65">{event.venue_address}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-1">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40 mb-2">About</p>
              <p className="font-sans text-sm text-peat/75 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-5 pt-1">
            {event.price_range && (
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40 mb-1">Price</p>
                <p className="font-sans text-sm text-peat/75">{event.price_range}</p>
              </div>
            )}
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/40 mb-1">Vibe Level</p>
              <VibeDifficulty level={event.vibe_difficulty} />
            </div>
          </div>

          {/* Ticket link */}
          {event.ticket_url && (
            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-gold/40 text-gold-dark font-sans text-xs tracking-widest uppercase hover:bg-forest hover:border-forest hover:text-parchment-light transition-all"
              onClick={e => e.stopPropagation()}>
              Get Tickets
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}

          {/* LARP Together */}
          <div className="border-t border-peat/10 pt-4">
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

export default function EventCard({ event, index, accent = '#4B5DF0' }: { event: Event; index?: number; accent?: string }) {
  const { month, day, weekday } = parseDateParts(event.event_date);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className="relative overflow-hidden rounded-[18px] transition-all duration-500 cursor-pointer group flex flex-col bg-parchment-light border border-peat/10 shadow-[0_2px_24px_rgba(16, 17, 20,0.07)] hover:border-gold/40 hover:shadow-[0_8px_40px_rgba(16, 17, 20,0.10)]"
      >
        {/* top hairline accent */}
        <span className="absolute top-0 left-0 h-px w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 70%)` }} />

        {/* Editorial date masthead */}
        <div className="relative px-5 sm:px-6 pt-6 pb-5 flex items-start justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display leading-none text-[52px] sm:text-[64px] -tracking-[0.02em]" style={{ color: accent }}>
              {day}
            </span>
            <div className="pb-1.5">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-peat/45 leading-none mb-1">{month}</p>
              <p className="font-display italic text-peat/50 text-sm leading-none">{weekday}</p>
            </div>
          </div>
          <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-peat/50 border border-gold/30 px-2.5 py-1">
            {event.category}
          </span>
        </div>

        <div className="rule-champagne-dim mx-5 sm:mx-6" />

        {/* Content */}
        <div className="px-5 sm:px-6 py-5 flex-1 flex flex-col">
          <h3 className="font-display text-forest text-2xl sm:text-3xl leading-[1.05] mb-2 group-hover:text-gold-dark transition-colors duration-300">
            {event.title}
          </h3>

          <p className="font-sans text-[11px] text-peat/50 tracking-[0.15em] uppercase mb-3">
            {event.venue_name}{event.neighborhood ? ` · ${event.neighborhood}` : ''}
          </p>

          {event.event_time && (
            <div className="flex items-center gap-1.5 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold/60 shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="font-sans text-xs text-peat/60">{weekday} at {formatTime(event.event_time)}</p>
            </div>
          )}

          {event.description && (
            <p className="font-sans text-sm text-peat/70 leading-relaxed mb-5 flex-1 line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gold/15 mt-auto">
            <div className="flex items-center gap-3">
              {event.price_range && (
                <span className="font-sans text-xs text-peat/50 font-medium">{event.price_range}</span>
              )}
              <VibeDifficulty level={event.vibe_difficulty} />
            </div>
            <span className="link-underline">
              View details <span aria-hidden>→</span>
            </span>
          </div>
        </div>

        {/* LARP Together */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gold/15" onClick={e => e.stopPropagation()}>
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
