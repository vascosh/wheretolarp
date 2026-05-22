import Link from 'next/link';
import Image from 'next/image';
import BentoSubmitButton from './BentoSubmitButton';

export interface BentoCity {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  events: number;
  spaces: number;
}

interface Props {
  cities: BentoCity[];
}

/* City accent gradients, colours, skyline image filter + base fade colour */
const CITY_THEMES: Record<
  string,
  { bg: string; accent: string; imgFilter: string; solid: string }
> = {
  'new-york': {
    bg: 'linear-gradient(160deg, #0f2318 0%, #162d1e 100%)',
    accent: '#4a9e6a',
    imgFilter: 'brightness(0.85) saturate(0.9) contrast(1.05)',
    solid: '#0f2318',
  },
  london: {
    bg: 'linear-gradient(160deg, #0a1628 0%, #0e1f38 100%)',
    accent: '#4a7abf',
    imgFilter: 'brightness(0.75) saturate(0.4) sepia(0.5) hue-rotate(185deg) contrast(1.1)',
    solid: '#0a1628',
  },
  miami: {
    bg: 'linear-gradient(160deg, #0d2535 0%, #103044 100%)',
    accent: '#4ab5d4',
    imgFilter: 'brightness(0.75) saturate(0.5) sepia(0.6) hue-rotate(155deg) contrast(1.1)',
    solid: '#0d2535',
  },
};

const CARD_BASE =
  'rounded-[20px] sm:rounded-[22px] border border-champagne/15 bg-navy shadow-[0_4px_32px_rgba(0,0,0,0.3)] p-5 sm:p-8';

const INSTAGRAM_URL = 'https://www.instagram.com/wheretolarp/';
const INSTAGRAM_HANDLE = 'wheretolarp';

export default function BentoLanding({ cities }: Props) {
  return (
    <section className="bg-navy pt-nav pb-10 sm:pb-12 pb-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 flex flex-col gap-3 sm:gap-4 lg:gap-5">
        {/* Full-width horizontal hero bar */}
        <HeroCard />

        {/* Challenges · Instagram · Leaderboard — under the hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          <FeatureCard
            label="Earn It"
            title="Challenges"
            body="Hit the spots, log the visits, climb the ranks. New challenges every week."
            href="/challenges"
            cta="Take the Challenge"
          />
          <InstagramCard />
          <FeatureCard
            label="The Standings"
            title="Leaderboard"
            body="See who's topping the city. Where the real LARPers spend their time."
            href="/leaderboard"
            cta="View Rankings"
          />
        </div>

        {/* City cards row */}
        <div id="cities" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {cities.map((c) => (
            <CityCard key={c.slug} city={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Hero bar (full-width, horizontal) ─── */
function HeroCard() {
  return (
    <div
      className={`${CARD_BASE} relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-10`}
      style={{ borderTop: '1px solid rgba(201,169,110,0.6)' }}
    >
      <div className="md:flex-1">
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-3">
          Curated · 03 Cities
        </p>
        <h1 className="font-serif text-cream text-3xl sm:text-4xl md:text-display-md font-semibold leading-[1.05] mb-3">
          Start <span className="text-champagne italic">LARPing</span> Now
        </h1>
        <p className="font-sans text-cream/60 text-[13px] sm:text-base leading-relaxed max-w-xl">
          Discover the most photogenic, aspirational spots in New York, London, and Miami.
          Dress the part. Show up. Get the photo.
        </p>
      </div>
      {/* Buttons: full-width stacked on phones, inline beside the copy on md+ */}
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2.5 sm:gap-3 md:shrink-0">
        <Link
          href="#cities"
          className="btn-champagne w-full sm:w-auto justify-center whitespace-nowrap"
        >
          Explore Cities
        </Link>
        <BentoSubmitButton className="btn-navy w-full sm:w-auto justify-center whitespace-nowrap" />
      </div>
    </div>
  );
}

/* ─── Right column small feature cards ─── */
function FeatureCard({
  label,
  title,
  body,
  href,
  cta,
}: {
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`${CARD_BASE} group flex flex-col justify-between transition-colors duration-300 hover:bg-navy-light active:bg-navy-light min-h-[140px] sm:min-h-[180px]`}
    >
      <div>
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-2 sm:mb-3">
          {label}
        </p>
        <h3 className="font-serif text-cream text-xl sm:text-2xl font-semibold leading-tight mb-2 sm:mb-3 group-hover:text-champagne transition-colors">
          {title}
        </h3>
        <p className="font-sans text-cream/55 text-[13px] sm:text-sm leading-relaxed">{body}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 mt-4 sm:mt-6 px-4 sm:px-5 py-2 rounded-full border-[1.5px] border-champagne/60 text-champagne text-[10px] font-sans tracking-[0.15em] uppercase self-start group-hover:bg-champagne group-hover:text-navy group-hover:border-champagne transition-all">
        {cta}
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

/* ─── Instagram feature card (slots between Challenges + Leaderboard) ─── */
function InstagramCard() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow ${INSTAGRAM_HANDLE} on Instagram`}
      className={`${CARD_BASE} group relative overflow-hidden flex flex-col justify-between transition-colors duration-300 hover:bg-navy-light active:bg-navy-light min-h-[140px] sm:min-h-[180px]`}
    >
      {/* Subtle Instagram-tinted hover glow (kept low so the navy palette stays dominant) */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(225,48,108,0.10), transparent 65%)',
        }}
      />
      <div className="relative">
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-2 sm:mb-3">
          Follow Us
        </p>
        <h3 className="font-serif text-cream text-xl sm:text-2xl font-semibold leading-tight mb-2 sm:mb-3 group-hover:text-champagne transition-colors">
          {INSTAGRAM_HANDLE}
        </h3>
        <p className="font-sans text-cream/55 text-[13px] sm:text-sm leading-relaxed">
          Behind the scenes, city drops, and the weekly LARP edit.
        </p>
      </div>
      <span className="inline-flex items-center gap-2 mt-4 sm:mt-6 self-start transition-transform group-hover:translate-x-0.5">
        {/* Instagram glyph with brand-gradient stroke so it reads as Instagram
            without clashing with the navy/champagne palette */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient id="bento-ig-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="35%" stopColor="#fa7e1e" />
              <stop offset="65%" stopColor="#d62976" />
              <stop offset="100%" stopColor="#962fbf" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#bento-ig-grad)" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="url(#bento-ig-grad)" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="url(#bento-ig-grad)" />
        </svg>
        <span className="font-sans text-champagne text-[10px] tracking-[0.15em] uppercase">
          Open Instagram <span aria-hidden>↗</span>
        </span>
      </span>
    </a>
  );
}

/* ─── Bottom row: city accent cards ─── */
function CityCard({ city }: { city: BentoCity }) {
  const theme = CITY_THEMES[city.slug] ?? CITY_THEMES.london;
  return (
    <Link
      href={`/city/${city.slug}`}
      className="rounded-[20px] sm:rounded-[22px] border border-champagne/15 shadow-[0_4px_32px_rgba(0,0,0,0.3)] p-5 sm:p-8 relative overflow-hidden group transition-transform duration-500 hover:-translate-y-1 min-h-[170px] sm:min-h-[200px] flex flex-col justify-between"
      style={{ background: theme.bg }}
    >
      {/* hover shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.accent}22, transparent 70%)`,
        }}
      />

      {/* Skyline image — small, blended into the card colour, bottom-right */}
      <div
        className={`absolute right-2 pointer-events-none transition-transform duration-700 group-hover:scale-105 ${
          city.slug === 'london'
            ? 'w-[56%] h-[62%] bottom-10 sm:bottom-14'
            : 'w-[52%] h-[58%] bottom-6 sm:bottom-8'
        }`}
        style={{ mixBlendMode: 'screen' }}
      >
        <div className="relative w-full h-full" style={{ filter: theme.imgFilter }}>
          <Image
            src={`/city-${city.slug}.png`}
            alt={city.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-contain object-right-bottom"
            unoptimized
          />
        </div>
      </div>
      {/* Fade so the skyline melts into the card instead of a hard edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
        style={{ background: `linear-gradient(to top, ${theme.solid} 20%, transparent 100%)` }}
      />

      <div className="relative">
        <p
          className="font-sans text-[10px] tracking-[0.3em] uppercase mb-3 font-medium"
          style={{ color: theme.accent }}
        >
          {city.country}
        </p>
        <h3 className="font-serif text-cream text-3xl sm:text-4xl font-semibold leading-none mb-3 capitalize group-hover:text-champagne transition-colors">
          {city.name}
        </h3>
        <p className="font-sans text-cream/45 text-xs italic leading-relaxed mb-6 max-w-[150px]">
          {city.tagline}
        </p>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-5">
          {city.events > 0 && (
            <div>
              <p
                className="font-serif text-xl font-semibold leading-none mb-0.5"
                style={{ color: theme.accent }}
              >
                {city.events}
              </p>
              <p className="font-sans text-cream/35 text-[9px] tracking-widest uppercase">
                Events
              </p>
            </div>
          )}
          {city.spaces > 0 && (
            <div>
              <p
                className="font-serif text-xl font-semibold leading-none mb-0.5"
                style={{ color: theme.accent }}
              >
                {city.spaces}
              </p>
              <p className="font-sans text-cream/35 text-[9px] tracking-widest uppercase">
                Spaces
              </p>
            </div>
          )}
          {city.events === 0 && city.spaces === 0 && (
            <p className="font-sans text-cream/30 text-xs italic">Coming soon</p>
          )}
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-[1.5px] text-[10px] font-sans tracking-[0.15em] uppercase transition-all"
          style={{
            color: theme.accent,
            borderColor: `${theme.accent}66`,
            background: `${theme.accent}10`,
          }}
        >
          Enter
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
