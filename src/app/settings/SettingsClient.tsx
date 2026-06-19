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
      className="rounded-full object-cover w-full h-full border border-champagne/30" />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy w-full h-full border border-champagne/30"
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
    <div className="overflow-hidden border border-champagne/15 bg-navy/40">
      <div className="px-6 py-5 border-b border-champagne/15">
        <h2 className="headline-editorial text-cream text-2xl">{title}</h2>
        {description && <p className="font-sans text-cream/40 text-xs mt-1 tracking-wide">{description}</p>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function SavedBadge() {
  return (
    <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-champagne flex items-center gap-1.5 animate-fade-in">
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
    <div className="min-h-screen pt-nav bg-ink text-cream">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 70% 10%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/profile"
          className="inline-flex items-center gap-2 eyebrow-muted hover:text-champagne transition-colors mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 rounded-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Profile
        </Link>

        <div className="mb-10">
          <p className="eyebrow mb-3">Your Account</p>
          <h1 className="headline-editorial text-cream text-5xl sm:text-6xl mb-3">Settings</h1>
          <div className="rule-champagne-dim" />
        </div>

        <div className="space-y-6">

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
                    className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/60 border-b border-champagne/30 pb-1 hover:text-champagne hover:border-champagne transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50">
                    {uploading ? 'Uploading…' : 'Change Photo'}
                  </button>
                  <p className="font-sans text-[10px] text-cream/25 mt-2 tracking-wide">JPG, PNG, GIF · max 3MB</p>
                  {uploadError && <p className="font-sans text-xs text-red-400/70 mt-1">{uploadError}</p>}
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="settings-name" className="eyebrow-muted block mb-2">Display Name</label>
                <input id="settings-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  className="w-full bg-transparent border-b border-champagne/25 px-0 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne transition-all" />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="settings-bio" className="eyebrow-muted block mb-2">
                  Bio
                  <span className="ml-2 normal-case tracking-normal text-cream/25">optional · shown on your profile</span>
                </label>
                <textarea
                  id="settings-bio"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell the LARP community something about yourself…"
                  rows={3}
                  className="w-full bg-transparent border-b border-champagne/25 px-0 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne transition-all resize-none"
                />
                <p className="font-sans text-[10px] text-cream/25 mt-1 text-right tabular-nums">{bio.length}/200</p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="settings-username" className="eyebrow-muted block mb-2">
                  Username
                  <span className="ml-2 normal-case tracking-normal text-cream/25">optional · unique handle</span>
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-sans text-base text-champagne/50 pointer-events-none">@</span>
                  <input
                    id="settings-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                    placeholder="your_handle"
                    maxLength={20}
                    className="w-full bg-transparent border-b border-champagne/25 pl-5 pr-9 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne transition-all"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
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
                  <p className="font-sans text-[11px] text-cream/35 mt-2 tracking-wide">
                    Your profile URL: <span className="text-champagne/60">wheretolarp.com/u/{username.trim().toLowerCase()}</span>
                  </p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="settings-email" className="eyebrow-muted block mb-2">Email</label>
                <div id="settings-email" className="w-full border-b border-champagne/10 px-0 py-2.5 font-sans text-base text-cream/30">
                  {user.email}
                </div>
                <p className="font-sans text-[10px] text-cream/25 mt-2 tracking-wide">Email cannot be changed</p>
              </div>

              {profileError && <p className="font-sans text-xs text-red-400/70">{profileError}</p>}

              <div className="flex items-center gap-4">
                <button type="submit" disabled={profileSaving}
                  className="btn-editorial disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
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
                  <p className="font-sans text-sm text-cream/75 mb-0.5">Public profile</p>
                  <p className="font-sans text-xs text-cream/35 max-w-xs leading-relaxed">
                    Allow others to view your profile at{' '}
                    <span className="text-champagne/50">wheretolarp.com/u/{user.id.slice(0, 8)}…</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('publicProfile') && <SavedBadge />}
                  <Toggle enabled={publicProfile} onChange={v => saveToggle('publicProfile', v)} />
                </div>
              </div>

              {publicProfile && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-sans border border-champagne/15 bg-champagne/[0.05] text-champagne/65">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Your public profile is live at{' '}
                  <Link href={`/u/${user.id}`} target="_blank" className="underline hover:text-champagne transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 rounded-sm">
                    /u/{user.id.slice(0, 8)}…
                  </Link>
                </div>
              )}

              <div className="rule-champagne-dim" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/75 mb-0.5">Show email address</p>
                  <p className="font-sans text-xs text-cream/35 leading-relaxed">Hide your email — useful while streaming or screen-sharing.</p>
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
                  <p className="font-sans text-sm text-cream/75 mb-0.5">Plan invites</p>
                  <p className="font-sans text-xs text-cream/35 leading-relaxed">Show a badge when friends invite you to a LARP.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {savedToggles.has('notifyInvites') && <SavedBadge />}
                  <Toggle enabled={notifyInvites} onChange={v => saveToggle('notifyInvites', v)} />
                </div>
              </div>

              <div className="rule-champagne-dim" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-sans text-sm text-cream/75 mb-0.5">Friend requests</p>
                  <p className="font-sans text-xs text-cream/35 leading-relaxed">Show a badge when someone adds you as a friend.</p>
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
              <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center border border-champagne/20 bg-champagne/[0.05]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-champagne/50">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-display italic text-cream/45 text-lg mb-1">No purchases yet</p>
              <p className="font-sans text-cream/30 text-xs leading-relaxed max-w-xs mx-auto mb-6">
                Premium city guides and exclusive features will appear here.
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 font-sans text-[10px] tracking-[0.25em] uppercase border border-champagne/15 text-champagne/40">
                Coming Soon
              </span>
            </div>
          </SectionCard>

          {/* ── Account ──────────────────────────────── */}
          <SectionCard title="Account">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-cream/60 mb-0.5">Sign out</p>
                  <p className="font-sans text-xs text-cream/30">End your current session</p>
                </div>
                <Link href="/api/auth/signout"
                  className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/40 border border-champagne/20 px-5 py-2.5 hover:text-champagne hover:border-champagne/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
                  Sign Out
                </Link>
              </div>
              <div className="rule-champagne-dim" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-red-400/75 mb-0.5">Delete account</p>
                  <p className="font-sans text-xs text-cream/30">Permanently remove all your data</p>
                </div>
                <button onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError(''); }}
                  className="font-sans text-[10px] tracking-[0.25em] uppercase text-red-400/65 border border-red-500/30 px-5 py-2.5 hover:text-red-400 hover:border-red-500/60 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
                  Delete
                </button>
              </div>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Delete account confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-label="Delete account">
          <div className="w-full max-w-sm overflow-hidden bg-ink border border-champagne/20 shadow-[0_8px_48px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-5 border-b border-champagne/15">
              <p className="eyebrow mb-1">Irreversible</p>
              <h3 className="headline-editorial text-cream text-2xl">Delete account?</h3>
              <p className="font-sans text-cream/45 text-xs mt-1.5">This action is permanent and cannot be undone.</p>
            </div>
            <div className="px-6 py-6 space-y-5">
              <p className="font-sans text-sm text-cream/65 leading-relaxed">
                All your data — profile, plans, messages, and progress — will be permanently deleted.
              </p>
              <div>
                <label htmlFor="delete-confirm" className="eyebrow-muted block mb-2">
                  Type <span className="text-red-400/75 font-semibold">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  className="w-full bg-transparent border-b border-champagne/25 px-0 py-2.5 font-sans text-base text-cream placeholder:text-cream/20 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
              {deleteError && <p className="font-sans text-xs text-red-400/70">{deleteError}</p>}
              <div className="flex gap-4 pt-1">
                <button
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                  className="flex-1 btn-editorial-ghost disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
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
                  className="flex-1 inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-red-500/85 hover:bg-red-500 text-white font-sans text-[11px] font-semibold tracking-[0.25em] uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
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
