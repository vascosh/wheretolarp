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

const INSTAGRAM_URL = 'https://www.instagram.com/wheretolarp/';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/* Field-guide taxonomy per city — the specimen-plate metadata */
const PLATES: Record<
  string,
  { specimen: string; habitat: string; plumage: string; call: string; imgFilter: string }
> = {
  'new-york': {
    specimen: 'The Manhattanite',
    habitat: 'Madison Ave · The Carlyle',
    plumage: 'Quiet-luxury neutrals',
    call: '“We summer in Amagansett.”',
    imgFilter: 'grayscale(1) sepia(0.35) hue-rotate(65deg) saturate(0.9) brightness(1.02) contrast(1.05)',
  },
  london: {
    specimen: 'The Sloane',
    habitat: 'Mayfair · Sloane Street',
    plumage: 'Inherited tweed, good wellies',
    call: '“A place in the Cotswolds.”',
    imgFilter: 'grayscale(1) sepia(0.35) hue-rotate(65deg) saturate(0.9) brightness(1.02) contrast(1.05)',
  },
  miami: {
    specimen: 'The Collector',
    habitat: 'Faena · The Setai',
    plumage: 'Linen. No socks.',
    call: '“Basel was quieter this year.”',
    imgFilter: 'grayscale(1) sepia(0.35) hue-rotate(65deg) saturate(0.9) brightness(1.05) contrast(1.05)',
  },
};

/* The Society Pages — ledger of everything beyond the cities */
const SOCIETY_PAGES = [
  {
    label: 'LARP Mode',
    title: 'The Portfolio',
    body: 'A trading desk that exists to be photographed over your shoulder.',
    href: '/portfolio',
    cta: 'Open the desk',
    external: false,
  },
  {
    label: 'The Standings',
    title: 'The Leaderboard',
    body: 'Who is topping the city this week, and where they are spending their afternoons.',
    href: '/leaderboard',
    cta: 'View standings',
    external: false,
  },
  {
    label: 'Assignments',
    title: 'The Challenges',
    body: 'Weekly field exercises. Complete them in character, submit the evidence.',
    href: '/challenges',
    cta: 'Accept a challenge',
    external: false,
  },
  {
    label: 'The Edit',
    title: '@wheretolarp',
    body: 'Behind the scenes, city drops, and the daily LARP edit — straight to the feed.',
    href: INSTAGRAM_URL,
    cta: 'Follow along',
    external: true,
  },
];

export default function HeritageLanding({ cities, locationNames }: Props) {
  const spots = locationNames && locationNames.length >= 6 ? locationNames : FALLBACK_SPOTS;
  return (
    <div className="bg-parchment text-peat">
      <Hero />
      <Marquee names={spots} />
      <Plates cities={cities} />
      <Method />
      <SocietyPages />
      <ClosingBand />
    </div>
  );
}

/* ── Rotating wax-seal / circular-text stamp ─────────────────────────── */
function SocietySeal({ className, tone = 'forest' }: { className?: string; tone?: 'forest' | 'gold' }) {
  const stroke = tone === 'forest' ? '#1B2FDE' : '#4B5DF0';
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 200 200" className="h-full w-full animate-[spin_45s_linear_infinite]">
        <defs>
          <path id="seal-circle" d="M 100,100 m -74,0 a 74,74 0 1,1 148,0 a 74,74 0 1,1 -148,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth="1" />
        <circle cx="100" cy="100" r="88" fill="none" stroke={stroke} strokeOpacity="0.3" strokeWidth="0.75" />
        <circle cx="100" cy="100" r="56" fill="none" stroke={stroke} strokeOpacity="0.4" strokeWidth="0.75" />
        <text fill={stroke} fillOpacity="0.85" fontSize="10" letterSpacing="1.5" fontFamily="var(--font-helvetica)">
          <textPath href="#seal-circle">
            WHERE TO LARP · EST. MMXXV · NO ACTUAL WEALTH REQUIRED ·
          </textPath>
        </text>
        <text
          x="100" y="112" textAnchor="middle" fill={stroke}
          fontSize="34" fontFamily="var(--font-helvetica)" fontStyle="italic"
        >
          W
        </text>
      </svg>
    </div>
  );
}

/* ── Hero — the field guide's title page ─────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Double hairline plate frame around the whole title page */}
        <div className="relative mt-6 border border-forest/25 p-2 sm:mt-8">
          <div className="relative border border-forest/15 px-6 py-20 sm:px-12 sm:py-28 lg:px-20 lg:py-32">
            <SocietySeal className="pointer-events-none absolute right-5 top-5 h-20 w-20 opacity-70 sm:right-10 sm:top-10 sm:h-28 sm:w-28" />

            <p className="eyebrow animate-fade-in-up">A field guide to looking the part</p>

            <h1 className="headline-editorial mt-7 max-w-4xl text-[clamp(3rem,9vw,7.5rem)] animate-fade-in-up delay-100">
              Live beyond
              <br />
              your <em className="italic text-gold-dark">means.</em>
            </h1>

            <div className="mt-8 h-px w-12 bg-gold animate-divider-grow" />

            <p className="mt-8 max-w-xl font-sans text-base leading-relaxed text-peat/75 sm:text-lg animate-fade-in-up delay-200">
              A curated register of the rooms, streets, and terraces of New York,
              London, and Miami where you may convincingly appear wealthy.
              Dress the part. Get the photo. Post the LARP.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5 animate-fade-in-up delay-300">
              <Link href="/feed" className="btn-editorial">
                Enter the Society
              </Link>
              <a href="#plates" className="link-underline">
                Study the plates
              </a>
            </div>

            <p className="mt-12 font-display italic text-sm text-peat/40 animate-fade-in delay-500">
              No actual wealth required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Marquee — the venue tape ────────────────────────────────────────── */
function Marquee({ names }: { names: string[] }) {
  const row = names.map((n) => n.trim()).filter(Boolean);
  return (
    <section className="mt-16 border-y border-forest/15 bg-parchment-dark/60 py-4 sm:mt-24" aria-hidden>
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex w-max items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {row.map((name) => (
                <span
                  key={`${dup}-${name}`}
                  className="flex items-center whitespace-nowrap font-serif text-sm tracking-wide text-forest/70"
                >
                  <span className="px-5">{name}</span>
                  <span className="text-gold/70 text-[10px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── The Plates — cities as engraved specimen plates ─────────────────── */
function Plates({ cities }: { cities: LandingCity[] }) {
  return (
    <section id="plates" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Chapter One · The Habitats</p>
            <h2 className="headline-editorial mt-4 text-[clamp(2.2rem,5vw,3.8rem)]">
              Choose your <em className="italic text-gold-dark">specimen.</em>
            </h2>
          </div>
          <p className="max-w-xs font-sans text-sm leading-relaxed text-peat/60">
            Three cities. Three characters. Each plate records where the species
            gathers, what it wears, and what it says.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-3 sm:mt-16">
        {cities.map((city, i) => {
          const plate = PLATES[city.slug] ?? PLATES['new-york'];
          return (
            <Reveal key={city.slug} delay={i * 120}>
              <Link href={`/city/${city.slug}`} className="group block">
                <article className="plate-frame transition-shadow duration-500 group-hover:shadow-[0_14px_48px_rgba(27, 47, 222,0.16)]">
                  <div className="relative p-4 sm:p-5">
                    {/* Engraving-tinted skyline */}
                    <div className="relative aspect-[4/3] overflow-hidden border border-forest/15 bg-parchment-dark">
                      <Image
                        src={`/city-${city.slug}.png`}
                        alt={`${city.name} skyline`}
                        fill
                        sizes="(min-width: 768px) 30vw, 90vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        style={{ filter: plate.imgFilter }}
                      />
                      <div className="absolute inset-0 bg-forest/10 mix-blend-multiply" />
                      {/* Plate number chip */}
                      <span className="absolute left-3 top-3 border border-forest/30 bg-parchment-light/90 px-2.5 py-1 font-sans text-[10px] tracking-[0.3em] uppercase text-forest">
                        Plate {ROMAN[i]}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="mt-5">
                      <p className="eyebrow-muted">{city.country}</p>
                      <div className="mt-1.5 flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-3xl text-forest">{city.name}</h3>
                        <p className="font-display italic text-sm text-gold-dark">{plate.specimen}</p>
                      </div>
                    </div>

                    {/* Taxonomy ledger */}
                    <dl className="mt-5 space-y-2.5 font-sans text-[13px]">
                      {(
                        [
                          ['Habitat', plate.habitat],
                          ['Plumage', plate.plumage],
                          ['Call', plate.call],
                        ] as const
                      ).map(([term, def]) => (
                        <div key={term} className="ledger-row">
                          <dt className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-peat/45">{term}</dt>
                          <span className="leader" />
                          <dd className="shrink-0 max-w-[60%] truncate text-right text-peat/80">{def}</dd>
                        </div>
                      ))}
                    </dl>

                    {/* Footline */}
                    <div className="mt-6 flex items-center justify-between border-t border-forest/10 pt-4">
                      <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-peat/45">
                        {city.spaces} spots · {city.events} events
                      </p>
                      <span className="link-underline">Study the plate</span>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ── The Method — the only true sequence on the page ─────────────────── */
const METHOD = [
  {
    no: 'I',
    title: 'Choose your habitat',
    body: 'Pick a city and a spot from the register. Every entry is photogenic, plausible, and open to the public.',
  },
  {
    no: 'II',
    title: 'Dress the part',
    body: 'Each plate notes the local plumage. Commit to the character — halfway is how you get caught.',
  },
  {
    no: 'III',
    title: 'Post the LARP',
    body: 'Get the photo, file it to the feed, and climb the standings. Nobody needs to know.',
  },
];

function Method() {
  return (
    <section className="border-y border-forest/15 bg-parchment-dark/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Reveal>
          <p className="eyebrow">Chapter Two · The Method</p>
        </Reveal>
        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {METHOD.map((step, i) => (
            <Reveal key={step.no} delay={i * 120}>
              <div className="border-l border-gold/40 pl-6">
                <p className="font-display italic text-2xl text-gold-dark">{step.no}.</p>
                <h3 className="mt-3 font-serif text-xl text-forest">{step.title}</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-peat/65">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── The Society Pages — ledger of everything else ───────────────────── */
function SocietyPages() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Chapter Three · The Society Pages</p>
            <h2 className="headline-editorial mt-4 text-[clamp(2.2rem,5vw,3.8rem)]">
              Appendices &amp; <em className="italic text-gold-dark">apparatus.</em>
            </h2>
          </div>
          <BentoSubmitButton className="btn-editorial-ghost" />
        </div>
      </Reveal>

      <div className="mt-12 border-t border-forest/15">
        {SOCIETY_PAGES.map((p, i) => {
          const inner = (
            <div className="group grid gap-2 border-b border-forest/15 py-7 transition-colors duration-300 hover:bg-parchment-light sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-8 sm:px-4">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-peat/40">{p.label}</p>
              <div>
                <h3 className="font-display text-2xl text-forest transition-colors duration-300 group-hover:text-forest-light sm:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-1.5 max-w-xl font-sans text-sm leading-relaxed text-peat/60">{p.body}</p>
              </div>
              <span className="link-underline mt-2 sm:mt-0">{p.cta}</span>
            </div>
          );
          return (
            <Reveal key={p.title} delay={i * 80}>
              {p.external ? (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="block">
                  {inner}
                </a>
              ) : (
                <Link href={p.href} className="block">
                  {inner}
                </Link>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ── Closing band — deep racing green, gold seal ─────────────────────── */
function ClosingBand() {
  return (
    <section className="relative overflow-hidden bg-forest">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[120%] -translate-x-1/2"
        style={{ background: 'radial-gradient(ellipse at center, rgba(75, 93, 240,0.14), transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <SocietySeal className="h-24 w-24 sm:h-28 sm:w-28" tone="gold" />
        <h2 className="mt-10 font-display text-[clamp(2.4rem,6vw,4.5rem)] italic leading-[1.05] text-parchment-light">
          Nobody needs to know.
        </h2>
        <p className="mt-6 max-w-md font-sans text-sm leading-relaxed text-parchment-light/60">
          Membership is free, the lifestyle is borrowed, and the photographs are
          forever. The Society is now accepting new characters.
        </p>
        <Link href="/feed" className="btn-editorial-gold mt-10">
          Enter the Society
        </Link>
      </div>
    </section>
  );
}
