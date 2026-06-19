'use client';

import { useState, useMemo } from 'react';
import type { City, Location, Event } from '@/lib/types';
import EventCard from '@/components/EventCard';
import LocationCard from '@/components/LocationCard';
import SubmitSpotModal from '@/components/SubmitSpotModal';
import Reveal from '@/components/Reveal';
import clsx from 'clsx';

interface CityPageClientProps {
  city: City;
  events: Event[];
  spaces: Location[];
}

type Tab = 'events' | 'spaces';

/* Per-city accent (kept in sync with the editorial landing). */
const CITY_ACCENTS: Record<string, string> = {
  'new-york': '#4a9e6a',
  london: '#4a7abf',
  miami: '#4ab5d4',
};

const EVENT_CATEGORIES = [
  'Art & Galleries',
  'Dining & Nightlife',
  'Hotel Bars & Lounges',
  'Cultural',
  'Members Clubs',
  'Rooftop & Outdoor',
] as const;

export default function CityPageClient({ city, events, spaces }: CityPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [activeEventCat, setActiveEventCat] = useState<string>('All');
  const [activeSpaceCat, setActiveSpaceCat] = useState<string>('All');
  const [submitOpen, setSubmitOpen] = useState(false);

  const filteredEvents = useMemo(
    () => (activeEventCat === 'All' ? events : events.filter((e) => e.category === activeEventCat)),
    [events, activeEventCat]
  );

  const filteredSpaces = useMemo(
    () => (activeSpaceCat === 'All' ? spaces : spaces.filter((s) => s.category === activeSpaceCat)),
    [spaces, activeSpaceCat]
  );

  const eventCatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => { counts[e.category] = (counts[e.category] ?? 0) + 1; });
    return counts;
  }, [events]);

  const spaceCatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spaces.forEach((s) => { counts[s.category] = (counts[s.category] ?? 0) + 1; });
    return counts;
  }, [spaces]);

  const accent = CITY_ACCENTS[city.slug] ?? '#C9A96E';

  return (
    <>
      {/* ── Editorial city header ── */}
      <header className="relative bg-ink text-cream pt-nav overflow-hidden">
        {/* ambient champagne glow + city-accent wash */}
        <div
          className="pointer-events-none absolute -top-1/4 -right-1/4 h-[70vh] w-[70vh]"
          style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.10), transparent 65%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-1/4 -left-1/4 h-[60vh] w-[60vh]"
          style={{ background: `radial-gradient(circle, ${accent}1a, transparent 70%)` }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow mb-6 flex items-center gap-4">
              <span className="inline-block h-px w-10" style={{ backgroundColor: accent }} />
              <span style={{ color: accent }}>{city.country}</span>
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="headline-editorial text-cream text-[clamp(3rem,13vw,9rem)] capitalize">
              {city.name}
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="font-display italic text-cream/55 text-lg sm:text-2xl max-w-xl leading-relaxed mt-6">
              {city.tagline}
            </p>
          </Reveal>

          {/* hairline + register stats */}
          <Reveal delay={260}>
            <div className="rule-champagne-dim mt-12 mb-5" />
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              {events.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="numeral font-display text-3xl sm:text-4xl" style={{ color: accent }}>
                    {String(events.length).padStart(2, '0')}
                  </span>
                  <span className="eyebrow-muted text-cream/40">Upcoming Events</span>
                </div>
              )}
              {spaces.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="numeral font-display text-3xl sm:text-4xl" style={{ color: accent }}>
                    {String(spaces.length).padStart(2, '0')}
                  </span>
                  <span className="eyebrow-muted text-cream/40">Social Spaces</span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      {/* ── Sticky section switch (editorial tabs) ── */}
      <div className="sticky top-16 z-30 bg-cream/95 backdrop-blur-md border-b border-champagne/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-stretch gap-8 sm:gap-12">
          {([
            ['events', 'Events', events.length] as const,
            ['spaces', 'Social Spaces', spaces.length] as const,
          ]).map(([tab, label, count]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'relative py-4 font-sans text-[11px] tracking-[0.22em] uppercase transition-colors duration-300',
                activeTab === tab ? 'text-champagne-dark' : 'text-charcoal/55 hover:text-champagne-dark'
              )}
            >
              {label}
              {count > 0 && <span className="numeral ml-2 text-[10px]">{count}</span>}
              <span
                className={clsx(
                  'absolute left-0 -bottom-px h-[2px] w-full bg-champagne origin-left transition-transform duration-500',
                  activeTab === tab ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sticky category filter (hairline pills) ── */}
      <div className="sticky top-[105px] z-20 bg-cream/95 backdrop-blur-md border-b border-champagne/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 pb-0.5">
            {activeTab === 'events' ? (
              <>
                <button
                  onClick={() => setActiveEventCat('All')}
                  className={clsx(
                    'filter-pill shrink-0',
                    activeEventCat === 'All' ? 'filter-pill-active' : 'filter-pill-inactive'
                  )}
                >
                  All ({events.length})
                </button>
                {EVENT_CATEGORIES.filter((cat) => (eventCatCounts[cat] ?? 0) > 0).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveEventCat(cat)}
                    className={clsx(
                      'filter-pill shrink-0',
                      activeEventCat === cat ? 'filter-pill-active' : 'filter-pill-inactive'
                    )}
                  >
                    {cat} ({eventCatCounts[cat]})
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveSpaceCat('All')}
                  className={clsx(
                    'filter-pill shrink-0',
                    activeSpaceCat === 'All' ? 'filter-pill-active' : 'filter-pill-inactive'
                  )}
                >
                  All ({spaces.length})
                </button>
                {Object.entries(spaceCatCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <button
                      key={cat}
                      onClick={() => setActiveSpaceCat(cat)}
                      className={clsx(
                        'filter-pill shrink-0',
                        activeSpaceCat === cat ? 'filter-pill-active' : 'filter-pill-inactive'
                      )}
                    >
                      {cat} ({count})
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── The catalogue ── */}
      <div className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-h-[60vh]">
          <div className="flex items-baseline justify-between gap-6 mb-8">
            <p className="eyebrow-muted">
              {activeTab === 'events' ? 'The Calendar' : 'The Directory'}
            </p>
            <p className="hidden sm:block font-display italic text-charcoal/35 text-sm capitalize">
              {city.name} · The Register
            </p>
          </div>
          <div className="rule-champagne-dim mb-10" />

          {activeTab === 'events' ? (
            filteredEvents.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display italic text-charcoal/40 text-lg">
                  {events.length === 0
                    ? 'No upcoming events yet — check back soon.'
                    : 'No events in this category right now.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {filteredEvents.map((event, i) => (
                  <Reveal key={event.id} delay={(i % 3) * 80}>
                    <EventCard event={event} index={i} accent={accent} />
                  </Reveal>
                ))}
              </div>
            )
          ) : filteredSpaces.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display italic text-charcoal/40 text-lg">No spaces in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {filteredSpaces.map((space, i) => (
                <Reveal key={space.id} delay={(i % 3) * 80}>
                  <LocationCard
                    location={space}
                    isSelected={false}
                    onSelect={() => {}}
                    index={i}
                    accent={accent}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* ── Submission band ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="rule-champagne mb-10" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="eyebrow-muted mb-3">An Open Register</p>
              <h2 className="headline-editorial text-navy text-3xl sm:text-4xl">
                Know a spot that <span className="italic text-champagne-dark">belongs here</span>?
              </h2>
            </div>
            <button onClick={() => setSubmitOpen(true)} className="btn-editorial shrink-0">
              Submit a Spot <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating submit button (mobile) */}
      <button
        onClick={() => setSubmitOpen(true)}
        className="fixed bottom-6 right-4 z-40 sm:hidden bg-navy text-champagne border border-champagne/30 px-5 py-3.5 font-sans text-[11px] tracking-[0.22em] uppercase shadow-lg hover:bg-navy-light transition-colors duration-200"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        + Submit
      </button>

      <SubmitSpotModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
