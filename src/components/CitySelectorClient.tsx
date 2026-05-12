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

const CITY_THEMES: Record<string, {
  bg: string;
  bgHover: string;
  noise: string;
  label: string;
  imgFilter: string;
}> = {
  'new-york': {
    bg: 'linear-gradient(160deg, #0f2318 0%, #162d1e 50%, #0d1f15 100%)',
    bgHover: 'linear-gradient(160deg, #142b1f 0%, #1c3824 50%, #112318 100%)',
    noise: 'rgba(30,80,45,0.18)',
    label: '#4a9e6a',
    imgFilter: 'brightness(0.85) saturate(0.9) contrast(1.05)',
  },
  london: {
    bg: 'linear-gradient(160deg, #0a1628 0%, #0e1f38 50%, #081222 100%)',
    bgHover: 'linear-gradient(160deg, #0d1c32 0%, #122542 50%, #0a1528 100%)',
    noise: 'rgba(30,60,120,0.18)',
    label: '#4a7abf',
    imgFilter: 'brightness(0.75) saturate(0.4) sepia(0.5) hue-rotate(185deg) contrast(1.1)',
  },
  miami: {
    bg: 'linear-gradient(160deg, #0d2535 0%, #103044 50%, #0a1e2e 100%)',
    bgHover: 'linear-gradient(160deg, #112c3e 0%, #14384f 50%, #0d2438 100%)',
    noise: 'rgba(30,110,150,0.18)',
    label: '#4ab5d4',
    imgFilter: 'brightness(0.75) saturate(0.5) sepia(0.6) hue-rotate(155deg) contrast(1.1)',
  },
};

function CityCard({ city }: { city: CityData }) {
  const theme = CITY_THEMES[city.slug] ?? CITY_THEMES.london;

  return (
    <Link
      href={`/city/${city.slug}`}
      className="relative flex flex-col justify-end overflow-hidden group"
      style={{ background: theme.bg, minHeight: '100%' }}
    >
      {/* Hover bg shift */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: theme.bgHover }}
      />

      {/* Subtle texture noise */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${theme.noise} 0%, transparent 70%)`,
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-champagne/10" />

      {/* City image — blended into card colour */}
      <div
        className="absolute inset-x-4 top-8 pointer-events-none overflow-hidden"
        style={{ height: '52%', mixBlendMode: 'screen' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 group-hover:scale-105"
          style={{ filter: theme.imgFilter }}
        >
          <Image
            src={`/city-${city.slug}.png`}
            alt={city.name}
            fill
            className="object-contain object-bottom"
            unoptimized
          />
        </div>
      </div>

      {/* Bottom fade so image melts into text area */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{ background: `linear-gradient(to top, ${city.slug === 'new-york' ? '#0f2318' : city.slug === 'london' ? '#0a1628' : '#0d2535'} 35%, transparent 100%)` }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 sm:p-10">
        {/* City name */}
        <h2 className="font-serif text-cream text-4xl sm:text-5xl font-semibold leading-none mb-2 capitalize">
          {city.name}
        </h2>

        {/* Country label */}
        <p
          className="font-sans text-sm tracking-[0.15em] uppercase mb-4 font-medium"
          style={{ color: theme.label }}
        >
          {city.country}
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-champagne/30 mb-4" />

        {/* Tagline */}
        <p className="font-sans text-cream/45 text-xs sm:text-sm leading-relaxed mb-7 italic max-w-[220px]">
          {city.tagline}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-5 mb-8">
          {city.events > 0 && (
            <div>
              <p className="font-serif leading-none mb-1" style={{ color: theme.label, fontSize: '1.5rem', fontWeight: 600 }}>
                {city.events}
              </p>
              <p className="font-sans text-cream/35 text-[9px] tracking-widest uppercase">Events</p>
            </div>
          )}
          {city.events > 0 && city.spaces > 0 && (
            <div className="w-px h-7 bg-champagne/15" />
          )}
          {city.spaces > 0 && (
            <div>
              <p className="font-serif leading-none mb-1" style={{ color: theme.label, fontSize: '1.5rem', fontWeight: 600 }}>
                {city.spaces}
              </p>
              <p className="font-sans text-cream/35 text-[9px] tracking-widest uppercase">Spaces</p>
            </div>
          )}
          {city.events === 0 && city.spaces === 0 && (
            <p className="font-sans text-cream/25 text-xs italic">Coming soon</p>
          )}
        </div>

        {/* CTA */}
        <span
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs tracking-[0.2em] uppercase transition-all duration-200"
          style={{
            color: theme.label,
            border: `1px solid ${theme.label}40`,
            background: `${theme.label}10`,
          }}
        >
          Explore
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path d="M1 4H13M13 4L9.5 1M13 4L9.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {/* Right border separator */}
      <div className="absolute top-6 right-0 bottom-6 w-px bg-white/5" />
    </Link>
  );
}

interface CitySelectorClientProps {
  cities: CityData[];
}

export default function CitySelectorClient({ cities }: CitySelectorClientProps) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-3"
      style={{ minHeight: 'calc(100vh - 112px)' }}
    >
      {cities.map((city) => (
        <CityCard key={city.slug} city={city} />
      ))}
    </section>
  );
}
