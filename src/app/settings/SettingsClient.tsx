'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { signOut, useSession } from 'next-auth/react';

interface SettingsUser {
  id: string;
  email: string;
  name: string;
  bio: string;
  image: string;
  username: string | null;
  showEmail: boolean;
  publicProfile: boolean;
  notifyInvites: boolean;
  notifyFriends: boolean;
}

function Avatar({ name, image, size = 80 }: { name: string; image: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [image]);
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image && !imgError) {
    return <img src={image} alt={name} referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="rounded-full object-cover w-full h-full" />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy w-full h-full"
      style={{ background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function Toggle({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
      className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0',
        enabled ? 'bg-champagne' : 'bg-white/10',
        disabled && 'opacity-40 cursor-not-allowed')}>
      <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
        enabled ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h2 className="font-serif text-cream text-base font-semibold">{title}</h2>
        {description && <p className="font-sans text-cream/25 text-xs mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SavedBadge() {
  return (
    <span className="font-sans text-xs text-champagne/70 flex items-center gap-1.5 animate-fade-in">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Saved
    </span>
  );
}

type ToggleSetting = 'showEmail' | 'publicProfile' | 'notifyInvites' | 'notifyFriends';

export default function SettingsClient({ user }: { user: SettingsUser }) {
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [avatarUrl, setAvatarUrl] = useState(user.image);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [showEmail, setShowEmail] = useState(user.showEmail);
  const [publicProfile, setPublicProfile] = useState(user.publicProfile);
  const [notifyInvites, setNotifyInvites] = useState(user.notifyInvites);
  const [notifyFriends, setNotifyFriends] = useState(user.notifyFriends);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savedToggles, setSavedToggles] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed === (user.username ?? '').toLowerCase()) {
      setUsernameStatus('idle');
      return;
    }
    if (trimmed.length < 3 || !/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/profile/username-check?username=${encodeURIComponent(trimmed)}`);
      const d = await res.json();
      setUsernameStatus(d.available ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(timer);
  }, [username, user.username]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setUploadError(data.error ?? 'Upload failed.');
    } else {
      setAvatarUrl(data.url);
      updateSession({ image: data.url });
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername && usernameStatus === 'taken') {
      setProfileError('That username is already taken.');
      setProfileSaving(false);
      return;
    }
    if (trimmedUsername && usernameStatus === 'invalid') {
      setProfileError('Username must be 3–20 characters: letters, numbers, underscores only.');
      setProfileSaving(false);
      return;
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        bio: bio.trim() || null,
        username: trimmedUsername || null,
      }),
    });

    setProfileSaving(false);
    if (res.ok) {
      setProfileSaved(true);
      updateSession({ name: name.trim() });
      setTimeout(() => setProfileSaved(false), 3000);
    } else {
      const d = await res.json();
      setProfileError(d.error ?? 'Failed to save.');
    }
  }

  async function saveToggle(key: ToggleSetting, value: boolean) {
    const fieldMap: Record<ToggleSetting, string> = {
      showEmail: 'show_email',
      publicProfile: 'public_profile',
      notifyInvites: 'notify_invites',
      notifyFriends: 'notify_friends',
    };

    // Optimistic update
    if (key === 'showEmail') setShowEmail(value);
    if (key === 'publicProfile') setPublicProfile(value);
    if (key === 'notifyInvites') setNotifyInvites(value);
    if (key === 'notifyFriends') setNotifyFriends(value);

    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [fieldMap[key]]: value }),
    });

    setSavedToggles(s => new Set(s).add(key));
    setTimeout(() => setSavedToggles(s => { const n = new Set(s); n.delete(key); return n; }), 2000);
  }

  return (
    <div className="min-h-screen pt-nav"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 70% 10%, rgba(201,169,110,0.04) 0%, transparent 70%)' }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/profile"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.15em] uppercase text-cream/30 hover:text-cream/60 transition-colors mb-8">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Profile
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-cream text-3xl font-semibold mb-1">Settings</h1>
          <p className="font-sans text-cream/30 text-sm">Manage your account preferences</p>
        </div>

        <div className="space-y-5">

          {/* ── Profile ─────────────────────────────── */}
          <SectionCard title="Profile">
            <form onSubmit={saveProfile} className="space-y-5">
              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0 group cursor-pointer" style={{ width: 80, height: 80 }}
                  onClick={() => fileInputRef.current?.click()}>
                  <Avatar key={avatarUrl} name={name || user.email} image={avatarUrl} size={80} />
                  {/* Overlay */}
                  <div className={clsx(
                    'absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200',
                    'bg-black/50 opacity-0 group-hover:opacity-100',
                    uploading && 'opacity-100'
                  )}>
                    {uploading ? (
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="40" strokeDashoffset="20" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V8M8 12l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 rounded-full border border-white/[0.1] bg-white/[0.04] text-cream/60 font-sans text-xs tracking-wide hover:bg-white/[0.08] hover:text-cream transition-all disabled:opacity-50">
                    {uploading ? 'Uploading…' : 'Change Photo'}
                  </button>
                  <p className="font-sans text-[10px] text-cream/20 mt-1.5">JPG, PNG, GIF · max 3MB</p>
                  {uploadError && <p className="font-sans text-xs text-red-400/70 mt-1">{uploadError}</p>}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">Display Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all" />
              </div>

              {/* Bio */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Bio
                  <span className="ml-2 normal-case tracking-normal text-cream/20">optional · shown on your profile</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell the LARP community something about yourself…"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all resize-none"
                />
                <p className="font-sans text-[10px] text-cream/15 mt-1 text-right">{bio.length}/200</p>
              </div>

              {/* Username */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Username
                  <span className="ml-2 normal-case tracking-normal text-cream/20">optional · unique handle</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-sm text-cream/25 pointer-events-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                    placeholder="your_handle"
                    maxLength={20}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-7 pr-10 py-2.5 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/40 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <svg className="animate-spin text-cream/30" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="20" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                    {usernameStatus === 'available' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {usernameStatus === 'taken' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-400/60">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                {usernameStatus === 'taken' && (
                  <p className="font-sans text-[11px] text-red-400/60 mt-1">That username is already taken.</p>
                )}
                {usernameStatus === 'invalid' && (
                  <p className="font-sans text-[11px] text-red-400/60 mt-1">3–20 chars · letters, numbers, underscores only.</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="font-sans text-[11px] text-champagne/50 mt-1">Available!</p>
                )}
                {username.trim().length >= 3 && usernameStatus !== 'taken' && usernameStatus !== 'invalid' && (
                  <p className="font-sans text-[11px] text-cream/30 mt-1.5">
                    Your profile URL: <span className="text-cream/55">wheretolarp.com/u/{username.trim().toLowerCase()}</span>
                  </p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">Email</label>
                <div className="w-full bg-white/[0.02] border border-white/[0.04] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream/25">
                  {user.email}
                </div>
                <p className="font-sans text-[10px] text-cream/15 mt-1.5">Email cannot be changed</p>
              </div>

              {profileError && <p className="font-sans text-xs text-red-400/70">{profileError}</p>}

              <div className="flex items-center gap-3">
                <button type="submit" disabled={profileSaving}
                  className="px-6 py-2.5 rounded-full bg-champagne text-navy font-sans font-semibold text-xs tracking-[0.15em] uppercase hover:bg-champagne/90 transition-all disabled:opacity-50">
                  {profileSaving ? 'Saving…' : 'Save Profile'}
                </button>
                {profileSaved && <SavedBadge />}
              </div>
            </form>
          </SectionCard>

          {/* ── Privacy ─────────────────────────────── */}
          <SectionCard title="Privacy" description="Control what others can see">
            <div className="space-y-5">

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/70 mb-0.5">Public profile</p>
                  <p className="font-sans text-xs text-cream/25 max-w-xs">
                    Allow others to view your profile at{' '}
                    <span className="text-champagne/40">wheretolarp.com/u/{user.id.slice(0, 8)}…</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('publicProfile') && <SavedBadge />}
                  <Toggle enabled={publicProfile} onChange={v => saveToggle('publicProfile', v)} />
                </div>
              </div>

              {publicProfile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans"
                  style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.12)', color: 'rgba(201,169,110,0.6)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Your public profile is live at{' '}
                  <Link href={`/u/${user.id}`} target="_blank" className="underline hover:text-champagne transition-colors">
                    /u/{user.id.slice(0, 8)}…
                  </Link>
                </div>
              )}

              <div className="h-px bg-white/[0.05]" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/70 mb-0.5">Show email address</p>
                  <p className="font-sans text-xs text-cream/25">Hide your email — useful while streaming or screen-sharing.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('showEmail') && <SavedBadge />}
                  <Toggle enabled={showEmail} onChange={v => saveToggle('showEmail', v)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Notifications ────────────────────────── */}
          <SectionCard title="Notifications" description="Choose what you get notified about">
            <div className="space-y-5">

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/70 mb-0.5">Plan invites</p>
                  <p className="font-sans text-xs text-cream/25">Show a badge when friends invite you to a LARP.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('notifyInvites') && <SavedBadge />}
                  <Toggle enabled={notifyInvites} onChange={v => saveToggle('notifyInvites', v)} />
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/70 mb-0.5">Friend requests</p>
                  <p className="font-sans text-xs text-cream/25">Show a badge when someone adds you as a friend.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('notifyFriends') && <SavedBadge />}
                  <Toggle enabled={notifyFriends} onChange={v => saveToggle('notifyFriends', v)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Purchases ────────────────────────────── */}
          <SectionCard title="Purchases">
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.13)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-champagne/40">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-serif text-cream/35 text-base mb-1">No purchases yet</p>
              <p className="font-sans text-cream/20 text-xs leading-relaxed max-w-xs mx-auto mb-5">
                Premium city guides and exclusive features will appear here.
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase"
                style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.10)', color: 'rgba(201,169,110,0.35)' }}>
                Coming Soon
              </span>
            </div>
          </SectionCard>

          {/* ── Account ──────────────────────────────── */}
          <SectionCard title="Account">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-cream/50 mb-0.5">Sign out</p>
                  <p className="font-sans text-xs text-cream/20">End your current session</p>
                </div>
                <Link href="/api/auth/signout"
                  className="px-4 py-2 rounded-full border border-white/[0.08] font-sans text-xs text-cream/30 hover:text-cream/60 hover:border-white/[0.15] tracking-wider uppercase transition-all">
                  Sign Out
                </Link>
              </div>
              <div className="h-px bg-white/[0.05]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-red-400/70 mb-0.5">Delete account</p>
                  <p className="font-sans text-xs text-cream/20">Permanently remove all your data</p>
                </div>
                <button onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError(''); }}
                  className="px-4 py-2 rounded-full border border-red-500/30 font-sans text-xs text-red-400/60 hover:text-red-400 hover:border-red-500/60 tracking-wider uppercase transition-all">
                  Delete
                </button>
              </div>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Delete account confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-modal"
            style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <h3 className="font-serif text-cream text-lg font-semibold">Delete account?</h3>
              <p className="font-sans text-cream/40 text-xs mt-1">This action is permanent and cannot be undone.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="font-sans text-sm text-cream/60 leading-relaxed">
                All your data — profile, plans, messages, and progress — will be permanently deleted.
              </p>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">
                  Type <span className="text-red-400/70 font-semibold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-red-500/40 transition-all"
                />
              </div>
              {deleteError && <p className="font-sans text-xs text-red-400/70">{deleteError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.08] font-sans text-xs text-cream/40 hover:text-cream/70 hover:border-white/[0.15] tracking-wider uppercase transition-all disabled:opacity-40">
                  Cancel
                </button>
                <button
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError('');
                    const res = await fetch('/api/account/delete', { method: 'DELETE' });
                    if (res.ok) {
                      signOut({ callbackUrl: '/' });
                    } else {
                      const d = await res.json().catch(() => ({}));
                      setDeleteError(d.error ?? 'Failed to delete account. Please try again.');
                      setDeleting(false);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-full bg-red-500/80 hover:bg-red-500 font-sans text-xs text-white tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  {deleting ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
