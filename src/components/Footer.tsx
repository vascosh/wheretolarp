'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CITIES = [
  { slug: 'new-york', name: 'New York', no: 'I' },
  { slug: 'london', name: 'London', no: 'II' },
  { slug: 'miami', name: 'Miami', no: 'III' },
];

const SECTIONS = [
  { href: '/feed', label: 'The Feed' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default function Footer() {
  const pathname = usePathname();
  // The LARP portfolio page is meant to look real — hide site chrome there.
  if (pathname?.startsWith('/portfolio')) return null;

  return (
    <footer className="relative bg-ink overflow-hidden">
      {/* ambient champagne glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[120%]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(75, 93, 240,0.10), transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 pb-12">
        {/* Masthead */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 pb-12">
          <div className="max-w-md">
            <p className="eyebrow-light mb-5">Est. MMXXV · A Field Guide</p>
            <Link
              href="/"
              className="headline-editorial text-cream text-5xl sm:text-6xl block leading-[0.9] hover:text-champagne transition-colors duration-300"
            >
              Where<br />To LARP
            </Link>
            <p className="font-sans text-cream/35 text-sm mt-6 leading-relaxed">
              The curated register of where to be seen — and how to look like
              you were always meant to be there.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-12 sm:gap-20">
            <div>
              <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-gold-light/50 mb-5">The Cities</p>
              <ul className="space-y-3">
                {CITIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/city/${c.slug}`}
                      className="group flex items-baseline gap-3 font-serif text-cream/55 hover:text-champagne transition-colors duration-200"
                    >
                      <span className="numeral text-[10px] w-5">{c.no}</span>
                      <span className="tracking-wide">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-gold-light/50 mb-5">The Register</p>
              <ul className="space-y-3">
                {SECTIONS.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className="font-serif text-cream/55 hover:text-champagne transition-colors duration-200 tracking-wide"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rule-champagne-dim mb-6" />

        {/* Colophon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display italic text-champagne/60 text-base">
            Nobody needs to know.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-sans text-cream/30 text-[11px] tracking-[0.15em] uppercase hover:text-champagne transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-sans text-cream/30 text-[11px] tracking-[0.15em] uppercase hover:text-champagne transition-colors duration-200"
            >
              Terms
            </Link>
            <p className="font-sans text-cream/20 text-[11px] tracking-[0.1em]">
              &copy; {new Date().getFullYear()} Where To LARP
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
