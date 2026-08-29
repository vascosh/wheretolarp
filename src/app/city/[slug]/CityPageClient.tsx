'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
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

/* Plate numbering — matches the order of the landing page's specimen plates. */
const PLATE_NUMERALS: Record<string, string> = {
  'new-york': 'I',
  london: 'II',
  miami: 'III',
};

/* Green engraving duotone used across the field guide's imagery. */
const ENGRAVING_FILTER =
  'grayscale(1) sepia(0.35) hue-rotate(65deg) saturate(0.9) brightness(1.02) contrast(1.05)';

/* Gold accent passed down to the catalogue cards (hairlines, numerals). */
const GOLD = '#4B5DF0';

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

  const roman = PLATE_NUMERALS[city.slug] ?? 'I';
  const accent = GOLD;

  return (
    <>
      {/* ── Chapter opener — the city as a plate in the field guide ── */}
      <header className="relative bg-parchment pt-nav">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Double hairline plate frame around the chapter title page */}
          <div className="relative mt-6 border border-forest/25 p-2 sm:mt-8">
            <div className="relative border border-forest/15 px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
                <div>
                  <Reveal>
                    <p className="eyebrow flex items-center gap-4">
                      <span className="inline-block h-px w-10 bg-gold" />
                      Plate {roman} · {city.country}
                    </p>
                  </Reveal>

                  <Reveal delay={80}>
                    <h1 className="headline-editorial mt-6 text-[clamp(3rem,10vw,7rem)] capitalize">
                      {city.name}
                    </h1>
                  </Reveal>

                  <Reveal delay={180}>
                    <p className="mt-6 max-w-xl font-display text-lg italic leading-relaxed text-gold-dark sm:text-2xl">
                      {city.tagline}
                    </p>
                  </Reveal>

                  {/* Dotted-leader register stats */}
                  <Reveal delay={260}>
                    <div className="mt-10 h-px w-12 bg-gold" />
                    <dl className="mt-6 max-w-sm space-y-3 font-sans text-[13px]">
                      {events.length > 0 && (
                        <div className="ledger-row">
                          <dt className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-peat/45">
                            Upcoming Events
                          </dt>
                          <span className="leader" />
                          <dd className="numeral shrink-0 font-display text-2xl text-gold-dark sm:text-3xl">
                            {String(events.length).padStart(2, '0')}
                          </dd>
                        </div>
                      )}
                      {spaces.length > 0 && (
                        <div className="ledger-row">
                          <dt className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-peat/45">
                            Social Spaces
                          </dt>
                          <span className="leader" />
                          <dd className="numeral shrink-0 font-display text-2xl text-gold-dark sm:text-3xl">
                            {String(spaces.length).padStart(2, '0')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Reveal>
                </div>

                {/* Engraved skyline plate */}
                <Reveal delay={200}>
                  <figure>
                    <div className="relative aspect-[4/3] overflow-hidden border border-forest/15 bg-parchment-dark">
                      <Image
                        src={`/city-${city.slug}.png`}
                        alt={`${city.name} skyline`}
                        fill
                        sizes="(min-width: 1024px) 40vw, 90vw"
                        className="object-contain"
                        style={{ filter: ENGRAVING_FILTER }}
                        priority
                      />
                      <div className="absolute inset-0 bg-forest/10 mix-blend-multiply" />
                      <span className="absolute left-3 top-3 border border-forest/30 bg-parchment-light/90 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.3em] text-forest">
                        Plate {roman}
                      </span>
                    </div>
                    <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-peat/45 capitalize">
                        Fig. {roman} — {city.name}
                      </span>
                      <span className="font-display text-sm italic text-gold-dark/70">The Register</span>
                    </figcaption>
                  </figure>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Sticky section switch (editorial tabs) ── */}
      <div className="sticky top-16 z-30 mt-10 bg-parchment/95 backdrop-blur-md border-b border-gold/20">
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
                activeTab === tab ? 'text-gold-dark' : 'text-peat/55 hover:text-gold-dark'
              )}
            >
              {label}
              {count > 0 && <span className="numeral ml-2 text-[10px]">{count}</span>}
              <span
                className={clsx(
                  'absolute left-0 -bottom-px h-[2px] w-full bg-gold origin-left transition-transform duration-500',
                  activeTab === tab ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sticky category filter (hairline pills) ── */}
      <div className="sticky top-[105px] z-20 bg-parchment/95 backdrop-blur-md border-b border-gold/10 py-3">
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
      <div className="bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-h-[60vh]">
          <div className="flex items-baseline justify-between gap-6 mb-8">
            <p className="eyebrow-muted">
              {activeTab === 'events' ? 'The Calendar' : 'The Directory'}
            </p>
            <p className="hidden sm:block font-display italic text-peat/35 text-sm capitalize">
              {city.name} · The Register
            </p>
          </div>
          <div className="rule-champagne-dim mb-10" />

          {activeTab === 'events' ? (
            filteredEvents.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display italic text-peat/40 text-lg">
                  {events.length === 0
                    ? 'The calendar is blank — the Society will post notices shortly.'
                    : 'Nothing filed under this heading at present.'}
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
              <p className="font-display italic text-peat/40 text-lg">
                Nothing filed under this heading at present.
              </p>
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
              <h2 className="headline-editorial text-3xl sm:text-4xl">
                Know a spot that <em className="italic text-gold-dark">belongs here</em>?
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
        className="fixed bottom-6 right-4 z-40 sm:hidden bg-forest text-parchment-light border border-gold/40 px-5 py-3.5 font-sans text-[11px] tracking-[0.22em] uppercase shadow-[0_8px_28px_rgba(27, 47, 222,0.25)] hover:bg-forest-light transition-colors duration-200"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        + Submit
      </button>

      <SubmitSpotModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
