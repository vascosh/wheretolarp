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
      setError('Invalid email or password.');
    } else {
      onSuccess();
    }
  }

  return (
    <div className="px-6 pb-6 space-y-4">
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-white/10 bg-white/[0.04] text-cream/80 font-sans text-xs tracking-wide hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/20">or</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="font-sans text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
        )}
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="Email"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/40 transition-all"
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)} required
          placeholder="Password"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/40 transition-all"
        />
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.2em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-50"
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
      setError(data.error ?? 'Something went wrong.');
      setLoading(false);
      return;
    }

    const signInRes = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (!signInRes?.error) onSuccess();
    else setError('Account created but sign-in failed. Try signing in.');
  }

  return (
    <div className="px-6 pb-6 space-y-4">
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-white/10 bg-white/[0.04] text-cream/80 font-sans text-xs tracking-wide hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
      >
        <GoogleIcon />
        Sign up with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/20">or</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="font-sans text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
        )}
        <input
          type="text" value={name} onChange={e => setName(e.target.value)} required
          placeholder="Your name"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/40 transition-all"
        />
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="Email"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/40 transition-all"
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
          placeholder="Password (min. 8 chars)"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/40 transition-all"
        />
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.2em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-50"
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
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-modal"
        style={{ background: 'rgba(8,16,28,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-5">
          <div className="flex gap-1 p-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setTab('signin')}
              className={clsx(
                'px-4 py-1.5 rounded-full font-sans text-xs tracking-[0.12em] uppercase transition-all duration-200',
                tab === 'signin' ? 'bg-champagne text-navy font-semibold' : 'text-cream/40 hover:text-cream/70'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={clsx(
                'px-4 py-1.5 rounded-full font-sans text-xs tracking-[0.12em] uppercase transition-all duration-200',
                tab === 'signup' ? 'bg-champagne text-navy font-semibold' : 'text-cream/40 hover:text-cream/70'
              )}
            >
              Create Account
            </button>
          </div>
          <button onClick={onClose} className="text-cream/25 hover:text-cream/60 transition-colors p-1 rounded-full -mr-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px mx-6 bg-white/[0.06] mb-4" />

        {tab === 'signin'
          ? <SignInForm onSuccess={onSuccess} onClose={onClose} />
          : <SignUpForm onSuccess={onSuccess} onClose={onClose} />
        }
      </div>
    </div>,
    document.body
  );
}
