'use client';

import { useState, useMemo } from 'react';
import type { City, Location, Event } from '@/lib/types';
import EventCard from '@/components/EventCard';
import LocationCard from '@/components/LocationCard';
import SubmitSpotModal from '@/components/SubmitSpotModal';
import clsx from 'clsx';

interface CityPageClientProps {
  city: City;
  events: Event[];
  spaces: Location[];
}

type Tab = 'events' | 'spaces';

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

  return (
    <>
      {/* City Hero */}
      <div className="bg-navy pt-nav relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(201,169,110,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <p className="font-sans text-champagne/60 text-[10px] tracking-[0.4em] uppercase mb-4 animate-fade-in-up opacity-0">
            {city.country}
          </p>
          <h1 className="font-serif text-cream text-display-lg sm:text-display-xl font-semibold mb-4 animate-fade-in-up opacity-0 delay-100">
            {city.name}
          </h1>
          <div className="flex items-center gap-4 mb-5 animate-fade-in-up opacity-0 delay-200">
            <div className="h-px w-12 bg-champagne/40 animate-divider-grow" />
          </div>
          <p className="font-sans text-cream/50 text-base sm:text-lg max-w-lg leading-relaxed italic animate-fade-in-up opacity-0 delay-300">
            {city.tagline}
          </p>

          {/* Stats summary */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 animate-fade-in-up opacity-0 delay-400">
            {events.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-serif text-champagne text-2xl font-semibold">{events.length}</span>
                <span className="font-sans text-cream/40 text-xs tracking-wider uppercase">Upcoming Events</span>
              </div>
            )}
            {events.length > 0 && spaces.length > 0 && (
              <div className="hidden sm:block w-px h-8 bg-champagne/20" />
            )}
            {spaces.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-serif text-champagne text-2xl font-semibold">{spaces.length}</span>
                <span className="font-sans text-cream/40 text-xs tracking-wider uppercase">Social Spaces</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-30 bg-cream/95 backdrop-blur-sm border-b border-champagne/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2">
          <button
            onClick={() => setActiveTab('events')}
            className={clsx(
              'py-2.5 px-6 font-sans text-xs tracking-widest uppercase rounded-full transition-all duration-200 border',
              activeTab === 'events'
                ? 'bg-champagne text-navy border-champagne font-semibold shadow-sm'
                : 'bg-transparent text-muted border-charcoal/12 hover:text-charcoal hover:border-champagne/40'
            )}
          >
            Events
            {events.length > 0 && (
              <span className="ml-2 opacity-60 font-normal">{events.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={clsx(
              'py-2.5 px-6 font-sans text-xs tracking-widest uppercase rounded-full transition-all duration-200 border',
              activeTab === 'spaces'
                ? 'bg-champagne text-navy border-champagne font-semibold shadow-sm'
                : 'bg-transparent text-muted border-charcoal/12 hover:text-charcoal hover:border-champagne/40'
            )}
          >
            Social Spaces
            {spaces.length > 0 && (
              <span className="ml-2 opacity-60 font-normal">{spaces.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Category Filter */}
      <div className="sticky top-[112px] z-20 bg-cream/95 backdrop-blur-sm border-b border-champagne/10 py-3">
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

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
        {activeTab === 'events' ? (
          filteredEvents.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-sans text-muted text-sm italic">
                {events.length === 0
                  ? 'No upcoming events yet — check back soon.'
                  : 'No events in this category right now.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )
        ) : filteredSpaces.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-sans text-muted text-sm italic">No spaces in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <LocationCard
                key={space.id}
                location={space}
                isSelected={false}
                onSelect={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section footer — encourage submissions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border-t border-champagne/15 pt-8 text-center">
          <p className="font-sans text-muted text-sm mb-4">
            Know a spot that belongs here?
          </p>
          <button
            onClick={() => setSubmitOpen(true)}
            className="btn-champagne"
          >
            Submit a Spot
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M1 4H13M13 4L9.5 1M13 4L9.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating submit button (mobile) */}
      <button
        onClick={() => setSubmitOpen(true)}
        className="fixed bottom-6 right-4 z-40 sm:hidden bg-navy text-champagne border border-champagne/30 rounded-full px-5 py-3.5 font-sans text-xs tracking-widest uppercase shadow-lg hover:bg-navy-light transition-colors duration-200"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        + Submit
      </button>

      <SubmitSpotModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
