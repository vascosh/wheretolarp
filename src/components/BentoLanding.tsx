import Link from 'next/link';
import DropCountdown from './DropCountdown';
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

/* City accent gradients & colours per the design spec */
const CITY_THEMES: Record<string, { bg: string; accent: string }> = {
  'new-york': { bg: 'linear-gradient(160deg, #0f2318 0%, #162d1e 100%)', accent: '#4a9e6a' },
  london:     { bg: 'linear-gradient(160deg, #0a1628 0%, #0e1f38 100%)', accent: '#4a7abf' },
  miami:      { bg: 'linear-gradient(160deg, #0d2535 0%, #103044 100%)', accent: '#4ab5d4' },
};

const CARD_BASE =
  'rounded-[20px] sm:rounded-[22px] border border-champagne/15 bg-navy shadow-[0_4px_32px_rgba(0,0,0,0.3)] p-5 sm:p-8';

export default function BentoLanding({ cities }: Props) {
  return (
    <section className="bg-navy pt-nav pb-10 sm:pb-12 pb-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 md:auto-rows-[minmax(0,1fr)]">
          <HeroCard />
          <CountdownCard />
          <FeatureCard
            label="Earn It"
            title="Challenges"
            body="Hit the spots, log the visits, climb the ranks. New challenges every week."
            href="/challenges"
            cta="Take the Challenge"
          />
          <TaglineCard />
          <FeatureCard
            label="The Standings"
            title="Leaderboard"
            body="See who's topping the city. Where the real LARPers spend their time."
            href="/leaderboard"
            cta="View Rankings"
          />
          <div id="cities" className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mt-1">
            {cities.map((c) => (
              <CityCard key={c.slug} city={c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Hero card (left column, spans 2 rows) ─── */
function HeroCard() {
  return (
    <div
      className={`${CARD_BASE} md:row-span-2 relative flex flex-col justify-between md:min-h-[440px]`}
      style={{ borderTop: '1px solid rgba(201,169,110,0.6)' }}
    >
      <div>
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-4 sm:mb-5">
          Curated · 03 Cities
        </p>
        <h1 className="font-serif text-cream text-3xl sm:text-display-md md:text-display-lg font-semibold leading-[1.05] mb-4 sm:mb-5">
          Start <span className="text-champagne italic">LARPing</span> Now
        </h1>
        <p className="font-sans text-cream/60 text-[13px] sm:text-base leading-relaxed max-w-md">
          Discover the most photogenic, aspirational spots in New York, London, and Miami.
          Dress the part. Show up. Get the photo.
        </p>
      </div>
      {/* Buttons stack full-width on phones for big tap targets, inline on sm+ */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 mt-6 sm:mt-8">
        <Link
          href="#cities"
          className="btn-champagne w-full sm:w-auto justify-center"
        >
          Explore Cities
        </Link>
        <BentoSubmitButton className="btn-navy w-full sm:w-auto justify-center" />
      </div>
    </div>
  );
}

/* ─── Centre top: drop countdown gradient card ─── */
function CountdownCard() {
  return (
    <div
      className={`${CARD_BASE} relative overflow-hidden flex flex-col justify-center`}
      style={{ background: 'linear-gradient(135deg, #1a2d4a 0%, #0a1628 100%)' }}
    >
      {/* champagne shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(201,169,110,0.08), transparent 70%)',
        }}
      />
      <div className="relative">
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-4 text-center">
          Limited Drop
        </p>
        <DropCountdown />
      </div>
    </div>
  );
}

/* ─── Centre bottom: tagline / dark feature card ─── */
function TaglineCard() {
  return (
    <div
      className={`${CARD_BASE} relative overflow-hidden flex flex-col justify-center min-h-[120px] sm:min-h-[180px]`}
      style={{ background: '#081222' }}
    >
      {/* SVG wave overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="bento-wave"
            x="0"
            y="0"
            width="200"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0,60 Q50,20 100,60 T200,60"
              stroke="rgba(201,169,110,0.1)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M0,90 Q50,50 100,90 T200,90"
              stroke="rgba(201,169,110,0.07)"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bento-wave)" />
      </svg>
      <div className="relative">
        <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-3">
          The Brief
        </p>
        <p className="font-serif text-cream text-xl sm:text-2xl md:text-3xl italic leading-tight">
          A New Way Of{' '}
          <span className="text-champagne font-semibold">Exploring</span> Cities
        </p>
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
        <p className="font-sans text-cream/45 text-xs italic leading-relaxed mb-6 max-w-[240px]">
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
