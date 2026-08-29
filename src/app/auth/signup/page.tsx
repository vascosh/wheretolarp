'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/profile';
  const [name, setName] = useState('');
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

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'The request did not go through. Try again.');
      setLoading(false);
      return;
    }

    // Auto sign in after signup
    const signInRes = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push('/auth/signin');
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4 py-16 text-peat">
      <div className="relative w-full max-w-md">
        {/* Masthead */}
        <div className="text-center mb-10">
          <p className="eyebrow mb-5 flex items-center justify-center gap-3">
            <span className="inline-block h-px w-8 bg-gold/50" />
            Membership · The Society
            <span className="inline-block h-px w-8 bg-gold/50" />
          </p>
          <Link
            href="/"
            className="headline-editorial block text-4xl sm:text-5xl transition-colors duration-300 hover:text-forest-light"
          >
            Request <em className="italic text-gold-dark">entry</em>.
          </Link>
          <p className="mt-4 font-sans text-sm leading-relaxed text-peat/60">
            Create your place on the register.
          </p>
        </div>

        {/* Membership papers — framed certificate */}
        <div className="plate-frame shadow-[0_2px_24px_rgba(16, 17, 20,0.07)]">
          <div className="p-8 sm:p-10">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-editorial-ghost mb-7 w-full disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div className="mb-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-forest/15" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-peat/40">or</span>
              <div className="h-px flex-1 bg-forest/15" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="border border-burgundy/30 bg-burgundy/5 px-4 py-3 font-sans text-xs text-burgundy">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="signup-name" className="eyebrow-muted mb-2.5 block">Name</label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full border border-forest/20 bg-parchment-light px-3.5 py-2.5 font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="eyebrow-muted mb-2.5 block">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full border border-forest/20 bg-parchment-light px-3.5 py-2.5 font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="eyebrow-muted mb-2.5 block">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full border border-forest/20 bg-parchment-light px-3.5 py-2.5 font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-editorial mt-2 w-full disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="mt-7 text-center font-sans text-xs text-peat/55">
              Already a member?{' '}
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-gold-dark underline decoration-gold/50 underline-offset-4 transition-colors hover:text-forest">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center font-display text-sm italic text-peat/40">
          No actual wealth required.
        </p>
      </div>
    </div>
  );
}
