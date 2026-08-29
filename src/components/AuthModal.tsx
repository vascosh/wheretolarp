'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type Tab = 'signin' | 'signup';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: Tab;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const INPUT_CLASS =
  'w-full border border-forest/20 bg-parchment-light px-3.5 py-2.5 font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest';

function SignInForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    // Google needs a full redirect — come back to current page
    await signIn('google', { callbackUrl: window.location.href });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Those credentials are not on file. Check and re-enter.');
    } else {
      onSuccess();
    }
  }

  return (
    <div className="space-y-5 px-6 pb-7">
      <button
        onClick={handleGoogle}
        className="btn-editorial-ghost w-full"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-forest/15" />
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-peat/40">or</span>
        <div className="h-px flex-1 bg-forest/15" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2.5 font-sans text-xs text-burgundy">{error}</p>
        )}
        <div>
          <label htmlFor="authmodal-signin-email" className="eyebrow-muted mb-2 block">Email</label>
          <input
            id="authmodal-signin-email"
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="your@email.com"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="authmodal-signin-password" className="eyebrow-muted mb-2 block">Password</label>
          <input
            id="authmodal-signin-password"
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="••••••••"
            className={INPUT_CLASS}
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="btn-editorial w-full disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

function SignUpForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    await signIn('google', { callbackUrl: window.location.href });
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

    const signInRes = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (!signInRes?.error) onSuccess();
    else setError('The account exists, but sign-in failed. Use the Sign In tab.');
  }

  return (
    <div className="space-y-5 px-6 pb-7">
      <button
        onClick={handleGoogle}
        className="btn-editorial-ghost w-full"
      >
        <GoogleIcon />
        Sign up with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-forest/15" />
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-peat/40">or</span>
        <div className="h-px flex-1 bg-forest/15" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2.5 font-sans text-xs text-burgundy">{error}</p>
        )}
        <div>
          <label htmlFor="authmodal-signup-name" className="eyebrow-muted mb-2 block">Name</label>
          <input
            id="authmodal-signup-name"
            type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder="Your name"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="authmodal-signup-email" className="eyebrow-muted mb-2 block">Email</label>
          <input
            id="authmodal-signup-email"
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="your@email.com"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="authmodal-signup-password" className="eyebrow-muted mb-2 block">Password</label>
          <input
            id="authmodal-signup-password"
            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            placeholder="Min. 8 characters"
            className={INPUT_CLASS}
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="btn-editorial w-full disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default function AuthModal({ onClose, onSuccess, defaultTab = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/50 backdrop-blur-sm" onClick={onClose} />
      <div className="plate-frame relative z-10 w-full max-w-sm animate-scale-in text-peat shadow-modal">
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow mb-2">Membership · The Society</p>
              <h2 className="headline-editorial text-3xl">
                {tab === 'signin' ? (
                  <>Welcome <em className="italic text-gold-dark">back</em>.</>
                ) : (
                  <>Request <em className="italic text-gold-dark">entry</em>.</>
                )}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 p-1 text-peat/40 transition-colors hover:text-burgundy">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-7">
            <button
              onClick={() => setTab('signin')}
              className={clsx(
                'relative pb-3 font-sans text-[11px] tracking-[0.22em] uppercase transition-colors duration-300',
                tab === 'signin' ? 'text-forest' : 'text-peat/45 hover:text-peat/70'
              )}
            >
              Sign In
              <span className={clsx(
                'absolute left-0 -bottom-px h-px w-full bg-gold origin-left transition-transform duration-500',
                tab === 'signin' ? 'scale-x-100' : 'scale-x-0'
              )} />
            </button>
            <button
              onClick={() => setTab('signup')}
              className={clsx(
                'relative pb-3 font-sans text-[11px] tracking-[0.22em] uppercase transition-colors duration-300',
                tab === 'signup' ? 'text-forest' : 'text-peat/45 hover:text-peat/70'
              )}
            >
              Create Account
              <span className={clsx(
                'absolute left-0 -bottom-px h-px w-full bg-gold origin-left transition-transform duration-500',
                tab === 'signup' ? 'scale-x-100' : 'scale-x-0'
              )} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="rule-champagne mb-5" />

        {tab === 'signin'
          ? <SignInForm onSuccess={onSuccess} onClose={onClose} />
          : <SignUpForm onSuccess={onSuccess} onClose={onClose} />
        }
      </div>
    </div>,
    document.body
  );
}
