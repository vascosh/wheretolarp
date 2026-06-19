'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import SubmitSpotModal from './SubmitSpotModal';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';
import DMButton from './DMButton';
import DMSidebar from './DMSidebar';

function Avatar({ name, image, size = 28 }: { name?: string | null; image?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [image]);
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image && !imgError) {
    return (
      <img src={image} alt={name ?? ''} referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="rounded-full object-cover border border-champagne/30"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

/* Center nav links — understated editorial text links with a gold underline draw */
const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/challenges', label: 'Challenges' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmInitialConvId, setDmInitialConvId] = useState<string | undefined>();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/profile').then(r => r.json()).then(d => {
        if (d.profile) setShowEmail(d.profile.show_email ?? true);
      }).catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-user-menu]')) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for global openDM events (from public profiles, etc.)
  useEffect(() => {
    function handler(e: Event) {
      const { convId } = (e as CustomEvent).detail ?? {};
      setDmInitialConvId(convId);
      setDmOpen(true);
    }
    window.addEventListener('openDM', handler);
    return () => window.removeEventListener('openDM', handler);
  }, []);

  function openSignIn() { setAuthTab('signin'); setAuthOpen(true); setMobileMenuOpen(false); }
  function openSignUp() { setAuthTab('signup'); setAuthOpen(true); setMobileMenuOpen(false); }

  function openDMs(convId?: string) {
    setDmInitialConvId(convId);
    setDmOpen(true);
  }

  function closeDMs() {
    setDmOpen(false);
    setDmInitialConvId(undefined);
  }

  // Hide site chrome on the LARP portfolio page so it looks like a real
  // standalone app. (Kept after all hooks to respect the rules of hooks.)
  if (pathname?.startsWith('/portfolio')) return null;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-500 ${
        scrolled ? 'bg-cream/92 border-champagne/25 shadow-[0_1px_24px_rgba(10,22,40,0.06)]' : 'bg-cream/70 border-champagne/10'
      }`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — wordmark */}
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              <span className="font-display text-navy text-xl leading-none group-hover:text-champagne-dark transition-colors duration-300">W</span>
              <span className="hidden sm:block h-4 w-px bg-champagne/40" />
              <span className="font-sans text-navy/80 text-[10px] tracking-[0.35em] uppercase group-hover:text-champagne-dark transition-colors duration-300">
                Where To LARP
              </span>
            </Link>

            {/* Center — section links */}
            <div className="hidden sm:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((l) => {
                const active = pathname?.startsWith(l.href);
                return (
                  <Link key={l.href} href={l.href}
                    className={`relative font-sans text-[11px] tracking-[0.22em] uppercase transition-colors duration-300 group ${
                      active ? 'text-champagne-dark' : 'text-charcoal/70 hover:text-champagne-dark'
                    }`}>
                    {l.label}
                    <span className={`absolute left-0 -bottom-1.5 h-px bg-champagne origin-left transition-transform duration-500 w-full ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>
                );
              })}
            </div>

            {/* Right — actions */}
            <div className="hidden sm:flex items-center gap-5">
              <button onClick={() => setSubmitOpen(true)}
                className="font-sans text-[11px] tracking-[0.22em] uppercase text-navy border border-navy/20 hover:border-champagne hover:text-champagne-dark px-5 py-2.5 transition-all duration-300">
                Submit a Spot
              </button>

              {status === 'loading' ? (
                <div className="w-7 h-7 rounded-full bg-champagne/10 animate-pulse" />
              ) : session ? (
                <div className="flex items-center gap-3">
                  {/* DM inbox button */}
                  <DMButton onClick={() => openDMs()} />

                  {/* Notification bell */}
                  <NotificationBell onOpenDMs={openDMs} />

                  {/* User menu */}
                  <div className="relative" data-user-menu>
                    <button onClick={() => setUserMenuOpen(o => !o)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar key={session.user.image ?? ''} name={session.user.name} image={session.user.image} size={28} />
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                        className={`text-charcoal/40 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}>
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-52 overflow-hidden shadow-modal z-50 animate-scale-in"
                        style={{ background: '#060D18', border: '1px solid rgba(201,169,110,0.18)' }}>
                        <div className="px-4 py-3.5 border-b border-champagne/10">
                          <p className="eyebrow mb-1">Member</p>
                          <p className="font-serif text-sm text-cream/90 truncate">{session.user.name ?? 'Member'}</p>
                        </div>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 font-sans text-xs tracking-[0.1em] uppercase text-cream/65 hover:text-champagne hover:bg-champagne/[0.06] transition-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          My Profile
                        </Link>
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 font-sans text-xs tracking-[0.1em] uppercase text-cream/65 hover:text-champagne hover:bg-champagne/[0.06] transition-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Settings
                        </Link>
                        <button onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 font-sans text-xs tracking-[0.1em] uppercase text-cream/35 hover:text-cream/70 hover:bg-champagne/[0.04] transition-all border-t border-champagne/10">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button onClick={openSignIn}
                  className="font-sans text-[11px] tracking-[0.22em] uppercase text-navy bg-champagne hover:bg-champagne-light px-5 py-2.5 transition-all duration-300">
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile — bell + hamburger */}
            <div className="sm:hidden flex items-center gap-1">
              {session && (
                <>
                  <NotificationBell onOpenDMs={openDMs} />
                  <DMButton onClick={() => openDMs()} />
                </>
              )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-navy hover:text-champagne-dark transition-colors" aria-label="Toggle menu">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                {mobileMenuOpen ? (
                  <path d="M2 2L18 14M18 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                ) : (
                  <>
                    <path d="M1 1H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M1 8H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M1 15H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-cream/97 backdrop-blur-md border-t border-champagne/15 px-5 pt-3 space-y-0"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            {NAV_LINKS.map((l, i) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                className="flex items-baseline gap-4 py-4 font-serif text-2xl text-navy hover:text-champagne-dark transition-colors border-b border-champagne/[0.1]">
                <span className="numeral text-[11px] w-6">{String(i + 1).padStart(2, '0')}</span>
                {l.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-baseline gap-4 py-4 font-serif text-2xl text-navy hover:text-champagne-dark transition-colors border-b border-champagne/[0.1]">
                  <span className="numeral text-[11px] w-6">04</span>
                  My Profile
                </Link>
                <button onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="flex items-center w-full py-4 text-sm font-sans tracking-[0.18em] uppercase text-charcoal/40 hover:text-champagne-dark transition-colors border-b border-champagne/[0.1]">
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={openSignIn}
                className="flex items-center w-full py-4 text-sm font-sans tracking-[0.18em] uppercase text-navy hover:text-champagne-dark transition-colors border-b border-champagne/[0.1]">
                Sign In
              </button>
            )}
            <button onClick={() => { setMobileMenuOpen(false); setSubmitOpen(true); }}
              className="btn-editorial w-full mt-6">
              Submit a Spot
            </button>
          </div>
        )}
      </nav>

      <SubmitSpotModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} />

      {authOpen && (
        <AuthModal
          defaultTab={authTab}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => { setAuthOpen(false); update(); }}
        />
      )}

      <DMSidebar
        isOpen={dmOpen}
        onClose={closeDMs}
        initialConvId={dmInitialConvId}
      />
    </>
  );
}
