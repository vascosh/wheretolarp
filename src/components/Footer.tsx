import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-champagne/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
          <div>
            <Link
              href="/"
              className="font-serif text-cream text-lg tracking-[0.15em] uppercase font-semibold hover:text-champagne transition-colors duration-200"
            >
              Where To LARP
            </Link>
            <p className="font-sans text-cream/30 text-xs mt-2 max-w-xs leading-relaxed">
              The curated guide to looking like you belong in the world&apos;s most aspirational spaces.
            </p>
          </div>

          {/* City links */}
          <div className="flex items-center gap-6">
            <Link
              href="/city/new-york"
              className="font-serif text-sm text-cream/40 hover:text-champagne transition-colors duration-200 tracking-wide"
            >
              New York
            </Link>
            <Link
              href="/city/london"
              className="font-serif text-sm text-cream/40 hover:text-champagne transition-colors duration-200 tracking-wide"
            >
              London
            </Link>
            <Link
              href="/city/miami"
              className="font-serif text-sm text-cream/40 hover:text-champagne transition-colors duration-200 tracking-wide"
            >
              Miami
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-champagne/10 mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-cream/20 text-xs">
            Nobody needs to know.
          </p>
          <p className="font-sans text-cream/15 text-[11px]">
            &copy; {new Date().getFullYear()} Where To LARP
          </p>
        </div>
      </div>
    </footer>
  );
}
