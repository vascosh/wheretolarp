'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Props {
  userId: string;
  initialName: string;
  initialAvatar: string;
}

function Avatar({ name, image, size = 96 }: { name: string; image: string; size?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [image]);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image && !err) {
    return (
      <img src={image} alt={name} referrerPolicy="no-referrer"
        onError={() => setErr(true)}
        className="rounded-full object-cover w-full h-full" />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy w-full h-full"
      style={{ background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

export default function OnboardingClient({ userId, initialName, initialAvatar }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounced username availability check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) { setUsernameStatus('idle'); return; }
    if (trimmed.length < 3 || !/^[a-z0-9_]+$/.test(trimmed)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      const res = await fetch(`/api/profile/username-check?username=${encodeURIComponent(trimmed)}`);
      const d = await res.json();
      setUsernameStatus(d.available ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setAvatarUrl(data.url);
  }

  async function handleFinish() {
    if (saving) return;
    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid')) {
      setError('Please fix your username before continuing.');
      return;
    }

    setSaving(true);
    setError('');

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim() || initialName,
        bio: bio.trim() || null,
        username: trimmedUsername || null,
        onboarded: true,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong. Please try again.');
      setSaving(false);
      return;
    }

    await updateSession({ name: name.trim() || initialName, image: avatarUrl });
    router.push('/profile');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,169,110,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="font-serif text-cream/40 text-sm tracking-[0.3em] uppercase mb-2">Where To LARP</p>
          <h1 className="font-serif text-cream text-3xl font-semibold leading-tight">
            {step === 1 ? 'Welcome.' : step === 2 ? 'Choose your handle.' : 'About you.'}
          </h1>
          <p className="font-sans text-cream/30 text-sm mt-2">
            {step === 1 ? 'Set up your profile to get started.' : step === 2 ? 'A unique username others can find you by.' : 'Tell the community a little about yourself.'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
              s === step ? 'w-6 bg-champagne' : s < step ? 'w-4 bg-champagne/40' : 'w-4 bg-white/[0.1]'
            }`} />
          ))}
        </div>

        <div className="rounded-2xl px-6 py-7 space-y-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {step === 1 && (
            <>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative cursor-pointer group" style={{ width: 96, height: 96 }}
                  onClick={() => fileInputRef.current?.click()}>
                  <Avatar name={name || 'You'} image={avatarUrl} size={96} />
                  <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all
                    ${uploading ? 'bg-black/50 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V8M8 12l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="font-sans text-xs text-cream/30 hover:text-cream/60 tracking-wide transition-colors">
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
              </div>

              {/* Display name */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Display Name <span className="text-champagne">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-3 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all"
                />
              </div>

              <button
                onClick={() => { if (name.trim()) setStep(2); }}
                disabled={!name.trim()}
                className="w-full py-3 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.15em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Username <span className="text-cream/20 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-sm text-cream/30 pointer-events-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                    placeholder="your_handle"
                    maxLength={20}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-10 py-3 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <div className="w-3.5 h-3.5 border-2 border-champagne/20 border-t-champagne rounded-full animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {usernameStatus === 'taken' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-400/70">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                {usernameStatus === 'invalid' && (
                  <p className="font-sans text-[11px] text-red-400/60 mt-1.5">3–20 chars · letters, numbers, underscores only</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="font-sans text-[11px] text-red-400/60 mt-1.5">That username is taken</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="font-sans text-[11px] text-champagne/50 mt-1.5">Available!</p>
                )}
                {!username && (
                  <p className="font-sans text-[11px] text-cream/20 mt-1.5">You can set this later in Settings</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-full border border-white/[0.08] text-cream/40 font-sans text-xs tracking-wider uppercase hover:text-cream/60 transition-all">
                  Back
                </button>
                <button
                  onClick={() => { if (usernameStatus !== 'taken' && usernameStatus !== 'checking') setStep(3); }}
                  disabled={usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="flex-1 py-3 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.15em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Bio <span className="text-cream/20 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell the LARP community something about yourself…"
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-3 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all resize-none"
                />
                <p className="font-sans text-[10px] text-cream/15 mt-1 text-right">{bio.length}/200</p>
              </div>

              {error && <p className="font-sans text-xs text-red-400/70">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-full border border-white/[0.08] text-cream/40 font-sans text-xs tracking-wider uppercase hover:text-cream/60 transition-all">
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.15em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Setting up…' : 'Enter'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="font-sans text-cream/15 text-[11px] text-center mt-6 leading-relaxed">
          You can change all of this later in Settings.
        </p>
      </div>
    </div>
  );
}
