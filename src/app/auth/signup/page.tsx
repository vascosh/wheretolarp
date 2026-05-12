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
      setError(data.error ?? 'Something went wrong.');
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 50%, #050d16 100%)' }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,169,110,0.06) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-cream text-2xl tracking-[0.2em] uppercase hover:text-champagne transition-colors">
            Where To LARP
          </Link>
          <p className="font-sans text-cream/30 text-xs tracking-[0.15em] uppercase mt-2">Create Account</p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-8 sm:p-10">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-white/10 bg-white/5 text-cream font-sans text-sm tracking-wide hover:bg-white/10 hover:border-white/20 transition-all duration-200 mb-6 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25">or</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-sans px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/50 focus:bg-white/[0.08] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.2em] uppercase hover:bg-champagne/90 transition-all duration-200 disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center font-sans text-xs text-cream/30 mt-6">
              Already a member?{' '}
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-champagne/70 hover:text-champagne transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
