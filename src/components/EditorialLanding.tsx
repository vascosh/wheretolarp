import Link from 'next/link';
import Image from 'next/image';
import Reveal from './Reveal';
import BentoSubmitButton from './BentoSubmitButton';

export interface LandingCity {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  events: number;
  spaces: number;
}

interface Props {
  cities: LandingCity[];
  /** Real spot names pulled from the DB for the scrolling marquee. */
  locationNames?: string[];
}

/* Curated real spots — fallback so the marquee never looks empty */
const FALLBACK_SPOTS = [
  'Madison Avenue', 'Bemelmans Bar', 'The Carlyle', 'Ralph Lauren',
  'The Connaught Bar', 'Sloane Street', 'The Dorchester', 'The Lanesborough',
  'The Setai', 'Faena Hotel', 'Duke of York Square', 'The Mark',
];

/* Per-city accent + skyline image filter, blended into the ink background */
const CITY_THEMES: Record<string, { accent: string; imgFilter: string }> = {
  'new-york': { accent: '#4a9e6a', imgFilter: 'brightness(0.9) saturate(0.95) contrast(1.05)' },
  london: { accent: '#4a7abf', imgFilter: 'brightness(0.85) saturate(0.45) sepia(0.45) hue-rotate(185deg) contrast(1.1)' },
  miami: { accent: '#4ab5d4', imgFilter: 'brightness(0.85) saturate(0.55) sepia(0.55) hue-rotate(155deg) contrast(1.1)' },
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const INSTAGRAM_URL = 'https://www.instagram.com/wheretolarp/';

const REGISTER = [
  {
    no: 'i',
    label: 'LARP Mode',
    title: 'The Portfolio',
    body: 'A trading desk that exists to be photographed over your shoulder. Larp or be larped.',
    href: '/portfolio',
    cta: 'Open the desk',
    external: false,
  },
  {
    no: 'ii',
    label: 'The Standings',
    title: 'The Leaderboard',
    body: 'Who is topping the city this week. Where the real ones are actually spending their afternoons.',
    href: '/leaderboard',
    cta: 'View rankings',
    external: false,
  },
  {
    no: 'iii',
    label: 'The Edit',
    title: '@wheretolarp',
    body: 'Behind the scenes, city drops, and the daily LARP edit — straight to the feed.',
    href: INSTAGRAM_URL,
    cta: 'Follow along',
    external: true,
  },
];

export default function EditorialLanding({ cities, locationNames }: Props) {
  const spots = locationNames && locationNames.length >= 6 ? locationNames : FALLBACK_SPOTS;
  return (
    <div className="bg-ink text-cream">
      <Hero />
      <Marquee names={spots} />
      <CityIndex cities={cities} />
      <RegisterSection />
      <ClosingBand />
    </div>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-nav overflow-hidden">
      {/* ambient champagne glows */}
      <div
        className="pointer-events-none absolute -top-1/4 -right-1/4 h-[80vh] w-[80vh]"
        style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.12), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[60vh] w-[60vh]"
        style={{ background: 'radial-gradient(circle, rgba(20,34,64,0.7), transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12">
        <Reveal>
          <p className="eyebrow mb-8 flex items-center gap-4">
            <span className="inline-block h-px w-10 bg-champagne/50" />
            Curated · Three Cities · Members Only
          </p>
        </Reveal>

        <h1 className="headline-editorial text-cream">
          <Reveal as="span" className="block text-[clamp(2.75rem,9vw,8.5rem)]" delay={60}>
            Dress the part.
          </Reveal>
          <Reveal as="span" className="block text-[clamp(2.75rem,9vw,8.5rem)]" delay={140}>
            Start{' '}
            <span className="relative inline-block italic text-champagne">
              LARPing
              <span className="draw-underline absolute left-0 -bottom-1 sm:-bottom-2 h-[3px] sm:h-[5px] w-full bg-champagne" />
            </span>
          </Reveal>
        </h1>

        <Reveal delay={260}>
          <p className="font-sans text-cream/55 text-base sm:text-lg leading-relaxed max-w-xl mt-8">
            A field guide to the most photogenic, aspirational rooms in New York,
            London, and Miami. Show up looking like you were always meant to be there.
            Get the photo. Nobody needs to know.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-11 flex flex-col sm:flex-row gap-4">
            <Link href="#cities" className="btn-editorial">
              Explore the Register <span aria-hidden>↓</span>
            </Link>
            <BentoSubmitButton className="btn-editorial-ghost" />
          </div>
        </Reveal>
      </div>

      {/* bottom hairline + scroll cue */}
      <div className="relative max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 mt-16 sm:mt-24">
        <div className="rule-champagne-dim" />
        <div className="flex items-center justify-between py-5">
          <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/30">
            Where To LARP
          </span>
          <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/30 flex items-center gap-2">
            Scroll <span aria-hidden className="animate-float inline-block">↓</span>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Marquee (spot names) ─────────────────────── */
function Marquee({ names }: { names: string[] }) {
  // Interleave each spot name with a champagne dot separator.
  const words = names.flatMap((n) => [n, '·']);
  const line = [...words, ...words];
  return (
    <div className="relative border-y border-champagne/15 bg-navy py-6 overflow-hidden marquee-mask">
      <div className="flex w-max animate-marquee whitespace-nowrap" aria-hidden>
        {line.map((w, i) => (
          <span
            key={i}
            className={`mx-6 font-display italic text-2xl sm:text-3xl ${
              w === '·' ? 'text-champagne/40 not-italic' : 'text-cream/70'
            }`}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── City index (signature) ───────────────────── */
function CityIndex({ cities }: { cities: LandingCity[] }) {
  return (
    <section id="cities" className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 sm:py-32 scroll-mt-20">
      <Reveal>
        <div className="flex items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <p className="eyebrow mb-4">The Index</p>
            <h2 className="headline-editorial text-cream text-4xl sm:text-6xl">
              Choose your <span className="italic text-champagne">city</span>.
            </h2>
          </div>
          <p className="hidden sm:block font-sans text-cream/40 text-sm max-w-[16rem] text-right leading-relaxed">
            Three cities, fully scouted. Pick a room and go play.
          </p>
        </div>
      </Reveal>

      <div className="rule-champagne mb-2" />
      <ul>
        {cities.map((city, i) => (
          <Reveal as="li" key={city.slug} delay={i * 90}>
            <CityRow city={city} index={i} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function CityRow({ city, index }: { city: LandingCity; index: number }) {
  const theme = CITY_THEMES[city.slug] ?? CITY_THEMES.london;
  return (
    <Link
      href={`/city/${city.slug}`}
      className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-10 border-b border-champagne/15 py-8 sm:py-12 transition-colors duration-500 hover:bg-white/[0.02]"
    >
      {/* hover accent glow */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `linear-gradient(90deg, ${theme.accent}14, transparent 55%)` }}
      />

      {/* numeral */}
      <span className="relative numeral text-sm sm:text-lg w-8 sm:w-12">{ROMAN[index]}</span>

      {/* name + meta */}
      <div className="relative min-w-0">
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase mb-2" style={{ color: theme.accent }}>
          {city.country}
        </p>
        <h3 className="headline-editorial text-cream text-4xl sm:text-7xl capitalize transition-transform duration-500 group-hover:translate-x-2 group-hover:text-champagne">
          {city.name}
        </h3>
        <p className="font-display italic text-cream/45 text-sm sm:text-lg mt-3 max-w-md">
          {city.tagline}
        </p>
      </div>

      {/* skyline reveal + stats + arrow */}
      <div className="relative flex items-center gap-6 sm:gap-10">
        {/* stats */}
        <div className="hidden md:flex flex-col items-end gap-3">
          {city.events > 0 && (
            <Stat value={city.events} label="Events" accent={theme.accent} />
          )}
          {city.spaces > 0 && (
            <Stat value={city.spaces} label="Spaces" accent={theme.accent} />
          )}
          {city.events === 0 && city.spaces === 0 && (
            <span className="font-display italic text-cream/30 text-sm">Coming soon</span>
          )}
        </div>

        {/* skyline (reveals on hover, desktop only) */}
        <div className="hidden lg:block relative w-44 h-24 shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700"
            style={{ filter: theme.imgFilter, mixBlendMode: 'screen' }}
          >
            <Image
              src={`/city-${city.slug}.png`}
              alt={city.name}
              fill
              sizes="176px"
              className="object-contain object-right"
              unoptimized
            />
          </div>
        </div>

        {/* arrow */}
        <span
          className="relative shrink-0 grid place-items-center h-11 w-11 rounded-full border transition-all duration-500 group-hover:scale-110"
          style={{ borderColor: `${theme.accent}66`, color: theme.accent }}
        >
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="text-right leading-none">
      <span className="font-display text-2xl sm:text-3xl" style={{ color: accent }}>{value}</span>
      <span className="block font-sans text-[9px] tracking-[0.3em] uppercase text-cream/35 mt-1.5">{label}</span>
    </div>
  );
}

/* ─────────────────── The Register feature cards ─────────────────── */
function RegisterSection() {
  return (
    <section className="relative bg-navy border-t border-champagne/15 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-end justify-between gap-6 mb-14">
            <h2 className="headline-editorial text-cream text-4xl sm:text-6xl">
              The <span className="italic text-champagne">register</span>.
            </h2>
            <p className="eyebrow-muted hidden sm:block pb-3">Three ways to play</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-champagne/15">
          {REGISTER.map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="h-full">
              <RegisterCard item={item} last={i === REGISTER.length - 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegisterCard({
  item,
  last,
}: {
  item: (typeof REGISTER)[number];
  last: boolean;
}) {
  const inner = (
    <>
      <div>
        <div className="flex items-baseline justify-between mb-8">
          <span className="numeral font-display text-3xl normal-case lowercase">{item.no}</span>
          <span className="eyebrow">{item.label}</span>
        </div>
        <h3 className="font-display text-cream text-3xl sm:text-4xl mb-4 group-hover:text-champagne transition-colors duration-300">
          {item.title}
        </h3>
        <p className="font-sans text-cream/45 text-sm leading-relaxed max-w-xs">{item.body}</p>
      </div>
      <span className="link-underline mt-10">
        {item.cta} <span aria-hidden>{item.external ? '↗' : '→'}</span>
      </span>
    </>
  );

  const cls = `group flex flex-col justify-between min-h-[300px] p-8 sm:p-10 border-b border-champagne/15 transition-colors duration-500 hover:bg-white/[0.02] ${
    last ? '' : 'md:border-r'
  } border-champagne/15`;

  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={cls}>
      {inner}
    </Link>
  );
}

/* ─────────────────────────── Closing band ─────────────────────────── */
function ClosingBand() {
  return (
    <section className="relative bg-ink py-28 sm:py-40 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.10), transparent 65%)' }}
      />
      <Reveal className="relative max-w-4xl mx-auto px-6 text-center">
        <p className="eyebrow mb-8">Your room is waiting</p>
        <h2 className="headline-editorial text-cream text-5xl sm:text-7xl mb-10">
          Go look like you <span className="italic text-champagne">belong</span>.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#cities" className="btn-editorial">Pick a city</Link>
          <Link href="/feed" className="btn-editorial-ghost">See the feed</Link>
        </div>
      </Reveal>
    </section>
  );
}
