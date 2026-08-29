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
        className="rounded-full object-cover w-full h-full border border-gold/40" />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-forest w-full h-full border border-gold/40"
      style={{ background: 'linear-gradient(135deg, #4B5DF0, #1B2FDE)', fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

const INPUT_BASE =
  'w-full border border-forest/20 bg-parchment-light font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest';

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
      setError('Settle the username before proceeding.');
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
      setError(d.error ?? 'The filing did not go through. Try again.');
      setSaving(false);
      return;
    }

    await updateSession({ name: name.trim() || initialName, image: avatarUrl });
    router.push('/profile');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4 py-16 text-peat">
      <div className="relative w-full max-w-sm">
        {/* Masthead */}
        <div className="text-center mb-10">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3">
            <span className="inline-block h-px w-8 bg-gold/50" />
            Induction · The Society
            <span className="inline-block h-px w-8 bg-gold/50" />
          </p>
          <h1 className="headline-editorial text-4xl sm:text-5xl">
            {step === 1 ? (
              <>Your character <em className="italic text-gold-dark">awaits</em>.</>
            ) : step === 2 ? (
              <>Choose your <em className="italic text-gold-dark">handle</em>.</>
            ) : (
              <>For the <em className="italic text-gold-dark">record</em>.</>
            )}
          </h1>
          <p className="mt-3 font-display text-base italic text-peat/50">
            {step === 1
              ? 'Induction papers, part one: the likeness and the name.'
              : step === 2
              ? 'The name by which the Society will find you.'
              : 'A line or two for the register. Stay in character.'}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-px transition-all duration-300 ${
              s === step ? 'w-8 bg-gold' : s < step ? 'w-5 bg-gold/50' : 'w-5 bg-gold/20'
            }`} />
          ))}
        </div>

        {/* Induction papers */}
        <div className="plate-frame shadow-[0_2px_24px_rgba(16, 17, 20,0.07)]">
          <div className="px-6 py-7 space-y-5">

          {step === 1 && (
            <>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative cursor-pointer group" style={{ width: 96, height: 96 }}
                  onClick={() => fileInputRef.current?.click()}>
                  <Avatar name={name || 'You'} image={avatarUrl} size={96} />
                  <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all
                    ${uploading ? 'bg-forest/60 opacity-100' : 'bg-forest/60 opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-parchment-light/30 border-t-parchment-light rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V8M8 12l4-4 4 4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="font-sans text-[10px] tracking-[0.25em] uppercase text-peat/45 border-b border-transparent hover:text-gold-dark hover:border-gold/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50">
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
              </div>

              {/* Display name */}
              <div>
                <label htmlFor="onboard-name" className="eyebrow-muted block mb-2">
                  Display Name <span className="text-gold-dark">*</span>
                </label>
                <input
                  id="onboard-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className={`${INPUT_BASE} px-3.5 py-2.5`}
                />
              </div>

              <button
                onClick={() => { if (name.trim()) setStep(2); }}
                disabled={!name.trim()}
                className="btn-editorial w-full disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="onboard-username" className="eyebrow-muted block mb-2">
                  Username <span className="text-peat/40 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-base text-gold-dark/60 pointer-events-none">@</span>
                  <input
                    id="onboard-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                    placeholder="your_handle"
                    maxLength={20}
                    className={`${INPUT_BASE} pl-8 pr-10 py-2.5`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <div className="w-3.5 h-3.5 border-2 border-gold/25 border-t-gold-dark rounded-full animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-forest">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {usernameStatus === 'taken' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-burgundy">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                {usernameStatus === 'invalid' && (
                  <p className="font-sans text-[11px] text-burgundy mt-1.5">3–20 characters. Letters, numbers, underscores.</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="font-sans text-[11px] text-burgundy mt-1.5">That name is already on the register.</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="font-sans text-[11px] text-forest/70 mt-1.5">Available. It suits you.</p>
                )}
                {!username && (
                  <p className="font-sans text-[11px] text-peat/40 mt-1.5">You can set this later in Settings</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className="btn-editorial-ghost flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                  Back
                </button>
                <button
                  onClick={() => { if (usernameStatus !== 'taken' && usernameStatus !== 'checking') setStep(3); }}
                  disabled={usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="btn-editorial flex-1 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label htmlFor="onboard-bio" className="eyebrow-muted block mb-2">
                  Bio <span className="text-peat/40 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  id="onboard-bio"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="A line for the register. Old money, new hobby…"
                  rows={4}
                  className={`${INPUT_BASE} px-3.5 py-2.5 resize-none`}
                />
                <p className="font-sans text-[10px] text-peat/40 mt-1 text-right tabular-nums">{bio.length}/200</p>
              </div>

              {error && <p className="font-sans text-xs text-burgundy">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(2)}
                  className="btn-editorial-ghost flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="btn-editorial flex-1 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light"
                >
                  {saving ? 'Filing…' : 'Enter the Society'}
                </button>
              </div>
            </>
          )}
          </div>
        </div>

        <p className="font-sans text-peat/45 text-[11px] tracking-wide text-center mt-6 leading-relaxed">
          All of this may be amended later, in Settings.
        </p>
      </div>
    </div>
  );
}
