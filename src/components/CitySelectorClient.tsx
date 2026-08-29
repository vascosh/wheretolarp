'use client';

import Link from 'next/link';
import Image from 'next/image';

interface CityData {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  events: number;
  spaces: number;
}

/* Plate numbering — matches the field guide's specimen plates. */
const PLATE_NUMERALS: Record<string, string> = {
  'new-york': 'I',
  london: 'II',
  miami: 'III',
};

/* Green engraving duotone used across the field guide's imagery. */
const ENGRAVING_FILTER =
  'grayscale(1) sepia(0.35) hue-rotate(65deg) saturate(0.9) brightness(1.02) contrast(1.05)';

function CityCard({ city }: { city: CityData }) {
  const roman = PLATE_NUMERALS[city.slug] ?? 'I';

  return (
    <Link
      href={`/city/${city.slug}`}
      className="relative flex flex-col justify-end overflow-hidden group bg-parchment-light"
      style={{ minHeight: '100%' }}
    >
      {/* Hover surface shift — a faint parchment tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-parchment-dark/40"
      />

      {/* Top hairline rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-gold/30" />

      {/* Plate number chip */}
      <span className="absolute left-6 top-6 z-10 border border-forest/30 bg-parchment-light/90 px-2.5 py-1 font-sans text-[10px] tracking-[0.3em] uppercase text-forest">
        Plate {roman}
      </span>

      {/* City image — engraved into the paper.
          On phones it's nudged to the right half so it clears the left-aligned text;
          from `sm:` up it spans the card width as before. */}
      <div
        className="absolute left-[38%] right-4 sm:inset-x-4 top-8 pointer-events-none overflow-hidden"
        style={{ height: '52%', mixBlendMode: 'multiply' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 group-hover:scale-105"
          style={{ filter: ENGRAVING_FILTER }}
        >
          <Image
            src={`/city-${city.slug}.png`}
            alt={city.name}
            fill
            className="object-contain object-right-bottom sm:object-bottom"
            unoptimized
          />
        </div>
      </div>

      {/* Bottom fade so image melts into text area */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{ background: 'linear-gradient(to top, #FFFFFF 35%, transparent 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 sm:p-10">
        {/* Country eyebrow */}
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase mb-4 text-gold-dark">
          {city.country}
        </p>

        {/* City name */}
        <h2 className="headline-editorial text-5xl sm:text-6xl leading-[0.92] mb-4 capitalize transition-colors duration-500 group-hover:text-forest-light">
          {city.name}
        </h2>

        {/* Divider */}
        <div className="w-10 h-px bg-gold/50 mb-5" />

        {/* Tagline */}
        <p className="font-display italic text-gold-dark/80 text-sm sm:text-base leading-relaxed mb-8 max-w-[240px]">
          {city.tagline}
        </p>

        {/* Stats */}
        <div className="flex items-baseline gap-6 mb-9">
          {city.events > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl leading-none text-forest">{city.events}</span>
              <span className="font-sans text-peat/45 text-[9px] tracking-[0.25em] uppercase">Events</span>
            </div>
          )}
          {city.events > 0 && city.spaces > 0 && (
            <div className="w-px h-5 bg-gold/25 self-center" />
          )}
          {city.spaces > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl leading-none text-forest">{city.spaces}</span>
              <span className="font-sans text-peat/45 text-[9px] tracking-[0.25em] uppercase">Spaces</span>
            </div>
          )}
          {city.events === 0 && city.spaces === 0 && (
            <p className="font-display italic text-peat/40 text-sm">Coming soon</p>
          )}
        </div>

        {/* CTA */}
        <span
          className="inline-flex items-center gap-2 px-6 py-3 font-sans text-[11px] font-semibold tracking-[0.25em] uppercase text-forest border border-forest/30 transition-all duration-300 group-hover:border-forest group-hover:bg-forest/5"
        >
          Study the plate
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>

      {/* Right border separator */}
      <div className="absolute top-6 right-0 bottom-6 w-px bg-forest/15" />
    </Link>
  );
}

interface CitySelectorClientProps {
  cities: CityData[];
}

export default function CitySelectorClient({ cities }: CitySelectorClientProps) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-3 bg-parchment"
      style={{ minHeight: 'calc(100vh - 112px)' }}
    >
      {cities.map((city) => (
        <CityCard key={city.slug} city={city} />
      ))}
    </section>
  );
}
