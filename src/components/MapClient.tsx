'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CityData {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  events: number;
  spaces: number;
}

interface MapClientProps {
  cities: CityData[];
}

const ISLAND_POSITIONS: Record<
  string,
  { cx: number; cy: number; rx: number; ry: number; labelOffset: { x: number; y: number }; labelAnchor: string }
> = {
  'new-york': {
    cx: 627,
    cy: 276,
    rx: 190,
    ry: 170,
    labelOffset: { x: 0, y: 220 },   // below — NY is at top of map
    labelAnchor: 'translate(-50%, 0)',
  },
  london: {
    cx: 251,
    cy: 878,
    rx: 190,
    ry: 170,
    labelOffset: { x: 80, y: -220 }, // above, nudged right so it stays on screen
    labelAnchor: 'translate(-10%, -100%)',
  },
  miami: {
    cx: 978,
    cy: 904,
    rx: 190,
    ry: 170,
    labelOffset: { x: -80, y: -220 }, // above, nudged left
    labelAnchor: 'translate(-90%, -100%)',
  },
};

export default function MapClient({ cities }: MapClientProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  return (
    <section className="relative bg-navy h-[calc(100vh-160px)] overflow-visible">
      {/* Map container — rounded, blended edges */}
      <div
        className="absolute inset-6 rounded-3xl overflow-hidden"
        style={{
          maskImage: 'radial-gradient(ellipse 85% 88% at 50% 50%, black 55%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 88% at 50% 50%, black 55%, transparent 100%)',
        }}
      >
        <Image
          src="/wheretolarp-map.png"
          alt="WhereTo LARP world map"
          fill
          className="object-contain"
          unoptimized
          priority
        />

        {/* Inner vignette for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(10,22,40,0.4) 75%, rgba(10,22,40,0.8) 100%)',
          }}
        />
      </div>

      {/* SVG overlay with hit areas and decorations */}
      <svg
        viewBox="0 0 1254 1254"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 10 }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {cities.map((city) => {
          const pos = ISLAND_POSITIONS[city.slug];
          if (!pos) return null;
          const isHovered = hovered === city.slug;

          return (
            <g key={city.slug}>
              {/* Ambient glow aura behind island */}
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx + 30}
                ry={pos.ry + 30}
                fill="none"
                stroke="#C9A96E"
                strokeWidth="2"
                opacity={isHovered ? 0.5 : 0.15}
                style={{
                  animation: 'glow-breathe 3s ease-in-out infinite',
                  animationDelay: `${cities.indexOf(city) * 0.8}s`,
                  transition: 'opacity 0.3s ease',
                }}
                filter={isHovered ? 'url(#glow-strong)' : 'url(#glow)'}
              />

              {/* Pulse ring — constantly animating */}
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx - 20}
                ry={pos.ry - 20}
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1.5"
                style={{
                  animation: 'pulse-ring 3s ease-out infinite',
                  animationDelay: `${cities.indexOf(city) * 1}s`,
                  transformOrigin: `${pos.cx}px ${pos.cy}px`,
                }}
              />

              {/* Second pulse ring offset */}
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx - 20}
                ry={pos.ry - 20}
                fill="none"
                stroke="#C9A96E"
                strokeWidth="1"
                style={{
                  animation: 'pulse-ring 3s ease-out infinite',
                  animationDelay: `${cities.indexOf(city) * 1 + 1.5}s`,
                  transformOrigin: `${pos.cx}px ${pos.cy}px`,
                }}
              />

              {/* Clickable hit area */}
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx}
                ry={pos.ry}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHovered(city.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/city/${city.slug}`)}
              />
            </g>
          );
        })}
      </svg>

      {/* Label cards — positioned via percentage */}
      {cities.map((city) => {
        const pos = ISLAND_POSITIONS[city.slug];
        if (!pos) return null;
        const isHovered = hovered === city.slug;

        // Convert SVG coords to percentage positions for the label
        const leftPct = (pos.cx / 1254) * 100;
        const topPct = ((pos.cy + pos.labelOffset.y) / 1254) * 100;

        return (
          <div
            key={`label-${city.slug}`}
            className="absolute pointer-events-none transition-all duration-300 ease-out"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `${pos.labelAnchor} ${isHovered ? 'translateY(-8px)' : 'translateY(4px) scale(0.95)'}`,
              opacity: isHovered ? 1 : 0,
              zIndex: 20,
            }}
          >
            <div
              className="pointer-events-auto px-6 py-5 min-w-[220px]"
              style={{
                background: 'rgba(10, 22, 40, 0.95)',
                border: '1px solid rgba(201, 169, 110, 0.4)',
                boxShadow:
                  '0 0 30px rgba(201, 169, 110, 0.15), 0 8px 32px rgba(10, 22, 40, 0.6)',
              }}
              onMouseEnter={() => setHovered(city.slug)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/city/${city.slug}`)}
            >
              {/* Country */}
              <p className="font-sans text-champagne/50 text-[10px] tracking-[0.3em] uppercase mb-1">
                {city.country}
              </p>

              {/* City name */}
              <h3 className="font-serif text-cream text-2xl font-semibold leading-tight mb-3 capitalize">
                {city.name}
              </h3>

              {/* Divider */}
              <div className="w-full h-px bg-champagne/30 mb-3" />

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4">
                {city.events > 0 && (
                  <span className="font-sans text-cream/70 text-xs tracking-wide">
                    <span className="text-champagne font-semibold">{city.events}</span> Events
                  </span>
                )}
                {city.events > 0 && city.spaces > 0 && (
                  <span className="text-champagne/30">|</span>
                )}
                {city.spaces > 0 && (
                  <span className="font-sans text-cream/70 text-xs tracking-wide">
                    <span className="text-champagne font-semibold">{city.spaces}</span> Spaces
                  </span>
                )}
                {city.events === 0 && city.spaces === 0 && (
                  <span className="font-sans text-cream/40 text-xs tracking-wide italic">
                    Coming soon
                  </span>
                )}
              </div>

              {/* Explore button */}
              <button
                className="w-full py-2 px-4 font-sans text-xs tracking-[0.2em] uppercase text-navy bg-champagne/90 hover:bg-champagne transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/city/${city.slug}`);
                }}
              >
                Explore
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                  <path
                    d="M1 4H13M13 4L9.5 1M13 4L9.5 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {/* Mobile fallback — always-visible city labels at bottom */}
      <div className="absolute bottom-0 inset-x-0 md:hidden z-20 p-4 flex flex-col gap-2">
        {cities.map((city) => (
          <button
            key={`mobile-${city.slug}`}
            className="w-full py-3 px-5 flex items-center justify-between cursor-pointer"
            style={{
              background: 'rgba(10, 22, 40, 0.92)',
              border: '1px solid rgba(201, 169, 110, 0.3)',
            }}
            onClick={() => router.push(`/city/${city.slug}`)}
          >
            <div className="text-left">
              <p className="font-sans text-champagne/50 text-[9px] tracking-[0.25em] uppercase">
                {city.country}
              </p>
              <p className="font-serif text-cream text-lg font-semibold capitalize">
                {city.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {city.events > 0 && (
                <span className="font-sans text-cream/60 text-[11px]">
                  <span className="text-champagne font-semibold">{city.events}</span> events
                </span>
              )}
              {city.spaces > 0 && (
                <span className="font-sans text-cream/60 text-[11px]">
                  <span className="text-champagne font-semibold">{city.spaces}</span> spaces
                </span>
              )}
              <svg
                width="16"
                height="10"
                viewBox="0 0 16 10"
                fill="none"
                className="text-champagne/60"
              >
                <path
                  d="M1 5H15M15 5L10.5 1M15 5L10.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom note */}
      <div className="absolute bottom-0 inset-x-0 hidden md:block text-center py-3 z-20">
        <p className="font-sans text-cream/20 text-xs tracking-wider italic">
          More cities coming soon — because the aspirational life is global.
        </p>
      </div>
    </section>
  );
}
