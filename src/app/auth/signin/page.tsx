'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn('google', { callbackUrl });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 50%, #050d16 100%)' }}
    >
      {/* Background texture */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,169,110,0.06) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        {/* Masthead */}
        <div className="text-center mb-10">
          <p className="eyebrow mb-5 flex items-center justify-center gap-3">
            <span className="inline-block h-px w-8 bg-champagne/50" />
            Members Only
            <span className="inline-block h-px w-8 bg-champagne/50" />
          </p>
          <Link href="/" className="headline-editorial text-cream text-4xl sm:text-5xl block hover:text-champagne transition-colors duration-300">
            Welcome <span className="italic text-champagne">back</span>.
          </Link>
          <p className="font-sans text-cream/40 text-sm mt-4 leading-relaxed">
            Sign in to the register.
          </p>
        </div>

        {/* Card — champagne hairline frame */}
        <div
          className="overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(201,169,110,0.22)', backdropFilter: 'blur(20px)' }}
        >
          <div className="rule-champagne-dim" />
          <div className="p-8 sm:p-10">
            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-champagne/25 bg-white/[0.03] text-cream font-sans text-[11px] tracking-[0.18em] uppercase hover:bg-champagne/[0.06] hover:border-champagne/50 transition-all duration-300 mb-7 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-7">
              <div className="flex-1 h-px bg-champagne/15" />
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/30">or</span>
              <div className="flex-1 h-px bg-champagne/15" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-sans px-4 py-3">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="signin-email" className="block eyebrow-muted text-cream/45 mb-2.5">Email</label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-transparent border-b border-champagne/25 px-1 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne transition-colors"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block eyebrow-muted text-cream/45 mb-2.5">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-champagne/25 px-1 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-editorial w-full disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center font-sans text-xs text-cream/35 mt-7">
              No account yet?{' '}
              <Link
                href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-champagne hover:text-champagne-light transition-colors underline underline-offset-4 decoration-champagne/40">
                Request entry
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
