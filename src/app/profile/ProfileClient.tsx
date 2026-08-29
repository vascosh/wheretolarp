'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import FollowListModal from '@/components/FollowListModal';

interface Plan {
  id: string;
  spot_name: string;
  spot_neighborhood: string | null;
  spot_category: string | null;
  spot_description?: string | null;
  plan_date: string;
  plan_time: string | null;
  notes: string | null;
  invite_token: string | null;
}

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface PendingFriend extends Friend {
  friendshipId: string;
}


interface ProfileClientProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  initialPlans: Plan[];
  initialFriends: Friend[];
  initialPending: PendingFriend[];
  initialShowEmail?: boolean;
  username?: string | null;
  initialBio?: string | null;
  initialFollowerCount?: number;
  initialFollowingCount?: number;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${m > 0 ? `:${String(m).padStart(2,'0')}` : ''} ${p}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Old Money': '#a8c8e8', 'Intellectual': '#c8c07a', 'Art World': '#d4a0b8',
  'Continental': '#90b8d8', 'Luxury Retail': '#d4a870', 'Power Lunch': '#90c8a8',
  'Weekend Aristocrat': '#b8a8d8', 'Hotel Lobby': '#c8a8e8', 'Rooftop Bar': '#a8d4a0',
  'Art & Galleries': '#d4a0b8', 'Dining & Nightlife': '#90b8d8', 'Hotel Bars & Lounges': '#c8a8e8',
  'Cultural': '#c8c07a', 'Members Clubs': '#a8c8e8', 'Rooftop & Outdoor': '#a8d4a0',
};

function Avatar({ name, image, size = 40 }: { name?: string | null; image?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-sans font-semibold text-forest shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #4B5DF0, #1B2FDE)', fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function ProfileCalendar({ plans, onDateSelect, selectedDate }: {
  plans: Plan[];
  onDateSelect: (d: string | null) => void;
  selectedDate: string | null;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const planDates = useMemo(() => new Set(plans.map(p => p.plan_date)), [plans]);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="card-paper p-5 select-none">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} aria-label="Previous month" className="w-8 h-8 flex items-center justify-center text-peat/40 hover:text-gold-dark transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h3 className="font-display text-forest text-xl">
          {MONTHS[viewMonth]} <span className="text-gold-dark italic">{viewYear}</span>
        </h3>
        <button onClick={next} aria-label="Next month" className="w-8 h-8 flex items-center justify-center text-peat/40 hover:text-gold-dark transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center font-sans text-[10px] tracking-[0.2em] uppercase text-peat/35 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday = dateStr === todayStr;
          const hasPlan = planDates.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button key={day} onClick={() => onDateSelect(isSelected ? null : dateStr)}
              className={clsx(
                'relative flex flex-col items-center justify-center h-9 rounded-lg font-sans text-sm transition-all duration-150',
                isSelected ? 'bg-forest text-parchment-light border border-forest'
                : isToday ? 'text-gold-dark border border-gold/40 bg-gold/[0.07]'
                : 'text-peat/60 hover:bg-peat/[0.05] hover:text-peat border border-transparent'
              )}>
              <span className="leading-none">{day}</span>
              {hasPlan && (
                <span className={clsx('absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  isSelected ? 'bg-gold-light' : 'bg-gold')} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-forest/10">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
          <span className="font-sans text-[10px] text-peat/45 tracking-wide">Plan saved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border border-gold/40 bg-gold/[0.07] inline-block" />
          <span className="font-sans text-[10px] text-peat/45 tracking-wide">Today</span>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Profile Modal ── */
function EditProfileModal({ user, showEmail, onToggleShowEmail, onSaved, onClose }: {
  user: { id: string; name?: string | null; image?: string | null };
  showEmail: boolean;
  onToggleShowEmail: (val: boolean) => void;
  onSaved: (name: string, avatarUrl: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? '');
  const [emailPrivacy, setEmailPrivacy] = useState(showEmail);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setAvatarUrl(data.url);
    } else {
      setError(data.error ?? 'Upload failed.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), avatar_url: avatarUrl || null, show_email: emailPrivacy }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(name.trim(), avatarUrl);
      onToggleShowEmail(emailPrivacy);
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to save.');
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/40 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[18px] border border-peat/10 bg-parchment-light shadow-[0_12px_48px_rgba(16, 17, 20,0.22)]"
        role="dialog" aria-modal="true" aria-label="Edit profile">
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/15">
          <div>
            <p className="eyebrow mb-1">Your Dossier</p>
            <h2 className="headline-editorial text-2xl">Edit Profile</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-peat/35 hover:text-gold-dark transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-6 space-y-6">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar name={name || 'U'} image={avatarUrl || null} size={56} />
              {uploading && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(27, 47, 222,0.6)' }}>
                  <div className="w-4 h-4 border-2 border-parchment-light/40 border-t-parchment-light rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="eyebrow-muted mb-2">Profile Photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="font-sans text-[10px] tracking-[0.25em] uppercase text-peat/60 border-b border-gold/40 pb-1 hover:text-gold-dark hover:border-gold transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                {uploading ? 'Uploading…' : 'Choose Photo'}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="edit-name" className="eyebrow-muted block mb-2">Name</label>
            <input id="edit-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
              className="w-full bg-transparent border-b border-peat/20 px-0 py-2.5 font-sans text-base text-peat placeholder:text-peat/30 focus:outline-none focus:border-gold transition-all" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm text-peat/80 mb-0.5">Show email address</p>
              <p className="font-sans text-xs text-peat/50">Hide your email from the profile header.</p>
            </div>
            <button type="button" onClick={() => setEmailPrivacy(!emailPrivacy)}
              aria-pressed={emailPrivacy} aria-label="Show email address"
              className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light',
                emailPrivacy ? 'bg-forest' : 'bg-peat/20')}>
              <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-parchment-light shadow transition-transform duration-200',
                emailPrivacy ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
          {error && <p className="font-sans text-xs text-burgundy">{error}</p>}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-editorial disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Add Friend Modal ── */
interface SearchResult {
  id: string;
  name: string | null;
  avatar_url: string | null;
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  friendshipId?: string;
}

function AddFriendModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [msgs, setMsgs] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function sendRequest(r: SearchResult) {
    const res = await fetch('/api/friends/by-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: r.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setSentIds(s => new Set(s).add(r.id));
      onAdded();
    } else {
      setMsgs(m => ({ ...m, [r.id]: data.error ?? 'Error' }));
    }
  }

  async function acceptRequest(r: SearchResult) {
    if (!r.friendshipId) return;
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId: r.friendshipId }),
    });
    setResults(rs => rs.map(x => x.id === r.id ? { ...x, status: 'accepted' } : x));
    onAdded();
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/40 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[18px] border border-peat/10 bg-parchment-light shadow-[0_12px_48px_rgba(16, 17, 20,0.22)]"
        role="dialog" aria-modal="true" aria-label="Add friend">
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/15">
          <div>
            <p className="eyebrow mb-1">The Register</p>
            <h2 className="headline-editorial text-2xl">Add Member</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-peat/35 hover:text-gold-dark transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-6 pt-5 pb-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name…"
            autoFocus
            aria-label="Search members by name"
            className="w-full bg-transparent border-b border-peat/20 px-0 py-2.5 font-sans text-base text-peat placeholder:text-peat/30 focus:outline-none focus:border-gold transition-all"
          />
        </div>
        <div className="px-6 pb-5 min-h-[60px]">
          {searching && (
            <p className="font-display italic text-peat/40 text-sm mt-4 text-center">Searching…</p>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="font-display italic text-peat/40 text-sm mt-4 text-center">No members found.</p>
          )}
          {results.map(r => {
            const isSent = sentIds.has(r.id) || r.status === 'pending_sent';
            const isAccepted = r.status === 'accepted';
            const isPendingReceived = r.status === 'pending_received';
            return (
              <div key={r.id} className="flex items-center gap-3 py-3.5 border-b border-forest/10 last:border-0">
                <Avatar name={r.name} image={r.avatar_url} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-peat truncate">{r.name ?? 'Member'}</p>
                  {msgs[r.id] && <p className="font-sans text-[10px] text-burgundy">{msgs[r.id]}</p>}
                </div>
                {isAccepted ? (
                  <span className="eyebrow-muted">Friends</span>
                ) : isPendingReceived ? (
                  <button onClick={() => acceptRequest(r)}
                    className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase bg-forest text-parchment-light px-4 py-2 hover:bg-forest-light transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                    Accept
                  </button>
                ) : isSent ? (
                  <span className="eyebrow-muted">Sent</span>
                ) : (
                  <button onClick={() => sendRequest(r)}
                    className="font-sans text-[10px] tracking-[0.2em] uppercase text-forest border border-forest/30 px-4 py-2 hover:border-forest hover:bg-forest/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Plan Detail Modal ── */
function PlanDetailModal({ plan, friends, onClose }: {
  plan: Plan;
  friends: Friend[];
  onClose: () => void;
}) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  // Get or create a shareable invite token
  async function getInviteToken() {
    if (inviteToken) return inviteToken;
    setLoadingToken(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (res.ok && data.invite?.token) {
        setInviteToken(data.invite.token);
        return data.invite.token as string;
      }
    } catch { /* ignore */ }
    setLoadingToken(false);
    return null;
  }

  async function handleCopyLink() {
    const token = await getInviteToken();
    setLoadingToken(false);
    if (token) {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function inviteFriend(friendId: string) {
    setInvitingFriend(friendId);
    setInviteError('');
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, invitee_id: friendId }),
      });
      if (res.ok) {
        setInvitedFriends(prev => new Set(prev).add(friendId));
      } else {
        const d = await res.json();
        setInviteError(d.error ?? 'Failed to invite.');
      }
    } catch {
      setInviteError('Network error.');
    }
    setInvitingFriend(null);
  }

  function buildGoogleCalendarUrl() {
    const d = plan.plan_date.replace(/-/g, '');
    let startDt = d;
    let endDt = d;
    if (plan.plan_time) {
      const t = plan.plan_time.replace(/:/g, '');
      startDt = `${d}T${t}00`;
      // end = start + 2h
      const [h, m] = plan.plan_time.split(':').map(Number);
      const endH = String(h + 2).padStart(2, '0');
      endDt = `${d}T${endH}${String(m).padStart(2, '0')}00`;
    }
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: plan.spot_name,
      dates: `${startDt}/${endDt}`,
      details: plan.spot_description ?? `LARP at ${plan.spot_name}`,
      location: plan.spot_neighborhood ?? '',
    });
    return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
  }

  const dateStr = plan.plan_date
    ? new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/40 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] rounded-[18px] border border-peat/10 bg-parchment-light shadow-[0_12px_48px_rgba(16, 17, 20,0.22)]"
        role="dialog" aria-modal="true" aria-label={plan.spot_name}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-forest/15 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="eyebrow mb-2">An Engagement</p>
              <h2 className="headline-editorial text-2xl sm:text-3xl leading-snug mb-1">{plan.spot_name}</h2>
              {plan.spot_neighborhood && (
                <p className="font-sans text-xs text-peat/50 tracking-wide">{plan.spot_neighborhood}</p>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="text-peat/35 hover:text-gold-dark transition-colors p-1 -mr-1 -mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Details */}
          <div className="space-y-3">
            {plan.spot_category && (
              <span className="inline-block font-sans text-[9px] tracking-[0.12em] uppercase px-3 py-1 border border-gold/40 bg-gold/[0.08] text-gold-dark">
                {plan.spot_category}
              </span>
            )}
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold-dark/70 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-peat/80">{dateStr}</span>
            </div>
            {plan.plan_time && (
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold-dark/70 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-peat/80">{formatTime(plan.plan_time)}</span>
              </div>
            )}
            {plan.spot_description && (
              <p className="font-sans text-xs text-peat/55 leading-relaxed">{plan.spot_description}</p>
            )}
            {plan.notes && (
              <p className="font-display italic text-sm text-peat/55">{plan.notes}</p>
            )}
          </div>

          {/* Invite Friends section */}
          {friends.length > 0 && (
            <div>
              <p className="eyebrow-muted mb-3">Invite Members</p>
              <div className="space-y-2">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 border border-forest/15 rounded-[10px] bg-parchment">
                    <Avatar name={f.name} image={f.avatar_url} size={30} />
                    <p className="font-serif text-sm text-peat/75 flex-1 truncate">{f.name ?? f.email}</p>
                    {invitedFriends.has(f.id) ? (
                      <span className="eyebrow-muted !text-gold-dark flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Sent
                      </span>
                    ) : (
                      <button onClick={() => inviteFriend(f.id)} disabled={invitingFriend === f.id}
                        className="font-sans text-[10px] tracking-[0.2em] uppercase text-forest border border-forest/30 px-3 py-1.5 hover:border-forest hover:bg-forest/5 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                        {invitingFriend === f.id ? '…' : 'Invite'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {inviteError && <p className="font-sans text-xs text-burgundy mt-2">{inviteError}</p>}
            </div>
          )}

          {/* Share link + Google Calendar */}
          <div className="space-y-3 pt-4 border-t border-forest/10">
            <button onClick={handleCopyLink} disabled={loadingToken}
              className="w-full btn-editorial-ghost disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {loadingToken ? 'Getting link...' : copied ? 'Copied!' : 'Copy Invite Link'}
            </button>

            <a href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-forest/20 text-peat/55 font-sans text-[11px] font-semibold tracking-[0.25em] uppercase transition-all hover:text-forest hover:border-forest/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 13v4M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add to Google Calendar
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ProfileClient({ user, initialPlans, initialFriends, initialPending, initialShowEmail = true, username, initialBio, initialFollowerCount = 0, initialFollowingCount = 0 }: ProfileClientProps) {
  const { update } = useSession();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [pending, setPending] = useState<PendingFriend[]>(initialPending);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);
  const [bio, setBioState] = useState(initialBio ?? '');
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [seasonXP, setSeasonXP] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'settings'>('plans');
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState<SearchResult[]>([]);
  const [friendSearching, setFriendSearching] = useState(false);
  const [friendSentIds, setFriendSentIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(initialShowEmail);
  const [displayUser, setDisplayUser] = useState(user);
  const [mounted, setMounted] = useState(false);

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);


  useEffect(() => { setMounted(true); }, []);

  // Poll follower/following counts every 15s
  useEffect(() => {
    function refresh() {
      fetch(`/api/users/${user.id}/stats`)
        .then(r => r.json())
        .then(d => {
          if (typeof d.followerCount === 'number') setFollowerCount(d.followerCount);
          if (typeof d.followingCount === 'number') setFollowingCount(d.followingCount);
        })
        .catch(() => {});
    }
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Fetch season XP from challenges
  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.seasonXP !== undefined) setSeasonXP(d.seasonXP); })
      .catch(() => {});
  }, []);


  const plansForSelectedDate = selectedDate ? plans.filter(p => p.plan_date === selectedDate) : [];
  const upcomingPlans = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return plans.filter(p => p.plan_date >= today).slice(0, 20);
  }, [plans]);

  async function deletePlan(id: string) {
    setDeletingId(id);
    await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
    setPlans(ps => ps.filter(p => p.id !== id));
    setDeletingId(null);
  }

  useEffect(() => {
    if (friendQuery.trim().length < 2) { setFriendResults([]); return; }
    const t = setTimeout(async () => {
      setFriendSearching(true);
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(friendQuery.trim())}`);
      const data = await res.json();
      setFriendResults(data.results ?? []);
      setFriendSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [friendQuery]);

  async function sendFriendRequest(r: SearchResult) {
    const res = await fetch('/api/friends/by-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: r.id }),
    });
    if (res.ok) {
      setFriendSentIds(s => new Set(s).add(r.id));
    }
  }

  async function acceptFriend(friendshipId: string) {
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId }),
    });
    const accepted = pending.find(p => p.friendshipId === friendshipId);
    if (accepted) {
      const { friendshipId: _, ...friendData } = accepted;
      setFriends(fs => [...fs, friendData]);
      setPending(ps => ps.filter(p => p.friendshipId !== friendshipId));
    }
  }

  async function declineFriend(friendshipId: string) {
    await fetch(`/api/friends?id=${friendshipId}`, { method: 'DELETE' });
    setPending(ps => ps.filter(p => p.friendshipId !== friendshipId));
  }

  function toggleShowEmail(val: boolean) {
    setShowEmail(val);
  }

  function handleProfileSaved(name: string, avatarUrl: string) {
    setDisplayUser(u => ({ ...u, name, image: avatarUrl || u.image }));
    update({ name, image: avatarUrl || undefined });
  }

  return (
    <div className="min-h-screen pt-nav bg-parchment text-peat">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Member dossier header — plate-frame character sheet */}
        <div className="plate-frame mb-8 sm:mb-10">
          <div className="relative p-6 sm:p-8">
            <p className="eyebrow mb-5">Your Dossier</p>
            <div className="flex items-start gap-5">
              <Avatar name={displayUser.name} image={displayUser.image} size={64} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="headline-editorial text-3xl sm:text-4xl">{displayUser.name ?? 'Member'}</h1>
                  <button onClick={() => setEditProfileOpen(true)}
                    className="text-peat/35 hover:text-gold-dark transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm"
                    aria-label="Edit profile" title="Edit profile">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {username && (
                  <p className="font-sans text-gold-dark text-[11px] tracking-[0.25em] uppercase mt-1">@{username}</p>
                )}
                {bio && (
                  <p className="font-display italic text-peat/60 text-base leading-relaxed mt-2 max-w-sm">{bio}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => signOut({ callbackUrl: '/' })}
                  className="font-sans text-[10px] tracking-[0.25em] uppercase text-peat/45 border border-forest/20 px-4 py-2.5 hover:text-forest hover:border-forest/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* Left */}
          <div className="space-y-6">
            <ProfileCalendar plans={plans} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

            {/* Plans for selected date */}
            {selectedDate && (
              <div>
                <p className="eyebrow-muted mb-3">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {plansForSelectedDate.length === 0 ? (
                  <p className="font-display italic text-peat/40 text-base">Nothing planned.</p>
                ) : (
                  <div className="space-y-3">
                    {plansForSelectedDate.map(p => (
                      <PlanCard key={p.id} plan={p} onDelete={deletePlan} deleting={deletingId === p.id} onClick={() => setSelectedPlan(p)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-forest/15">
              {(['plans', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={clsx(
                    'font-sans text-[11px] tracking-[0.25em] uppercase pb-3 mr-7 border-b-2 transition-all duration-200 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm',
                    activeTab === t ? 'border-gold text-forest' : 'border-transparent text-peat/40 hover:text-peat/70'
                  )}>
                  {t === 'plans' ? `Plans (${upcomingPlans.length})` : 'Settings'}
                </button>
              ))}
            </div>

            {/* Plans tab */}
            {activeTab === 'plans' && (
              <div className="space-y-3">
                {/* Pending friend requests */}
                {pending.length > 0 && (
                  <div className="space-y-2 pb-2">
                    <p className="eyebrow-muted">Friend Requests</p>
                    {pending.map(p => (
                      <div key={p.friendshipId} className="flex items-center gap-3 p-3 rounded-[14px] border border-gold/30 bg-gold/[0.06]">
                        <Avatar name={p.name} image={p.avatar_url} size={32} />
                        <p className="flex-1 font-serif text-sm text-peat/80 truncate">{p.name ?? 'Someone'}</p>
                        <button onClick={() => declineFriend(p.friendshipId)}
                          className="font-sans text-[10px] tracking-[0.2em] uppercase text-peat/45 border-b border-transparent hover:text-peat/70 hover:border-peat/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
                          Decline
                        </button>
                        <button onClick={() => acceptFriend(p.friendshipId)}
                          className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase bg-forest text-parchment-light px-4 py-2 hover:bg-forest-light transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment">
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {upcomingPlans.length === 0 ? (
                  <div className="card-paper p-10 text-center">
                    <p className="headline-editorial text-3xl mb-3 opacity-50">The diary is blank</p>
                    <p className="font-sans text-peat/50 text-xs mb-6">Browse a city and tap &ldquo;LARP here together&rdquo; to save.</p>
                    <Link href="/" className="btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                      Browse Cities
                    </Link>
                  </div>
                ) : upcomingPlans.map(p => (
                  <PlanCard key={p.id} plan={p} onDelete={deletePlan} deleting={deletingId === p.id} onClick={() => setSelectedPlan(p)} />
                ))}
              </div>
            )}

            {/* Settings tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <p className="eyebrow-muted mb-4">Edit Profile</p>
                  <div className="card-paper p-5">
                    <p className="font-sans text-sm text-peat/65 mb-4">Update your name, avatar, and privacy settings.</p>
                    <button onClick={() => setEditProfileOpen(true)}
                      className="btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                      Edit Profile
                    </button>
                  </div>
                </div>

                <div>
                  <p className="eyebrow-muted mb-4">Privacy</p>
                  <div className="card-paper p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans text-sm text-peat/80 mb-0.5">Show email address</p>
                        <p className="font-sans text-xs text-peat/50 leading-relaxed">
                          When off, your email is hidden — useful while streaming or sharing your screen.
                        </p>
                      </div>
                      <button
                        aria-pressed={showEmail} aria-label="Show email address"
                        onClick={() => {
                          const newVal = !showEmail;
                          setShowEmail(newVal);
                          fetch('/api/profile', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ show_email: newVal }),
                          });
                        }}
                        className={clsx(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light',
                          showEmail ? 'bg-forest' : 'bg-peat/20'
                        )}
                      >
                        <span className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-parchment-light shadow transition-transform duration-200',
                          showEmail ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Tier progress bar */}
            {(() => {
              const tiers = [
                { name: 'Bronze',   threshold: 0,    color: '#C8834A' },
                { name: 'Silver',   threshold: 300,  color: '#B0B8C8' },
                { name: 'Gold',     threshold: 600,  color: '#C9A227' },
                { name: 'Platinum', threshold: 900,  color: '#D4D8F0' },
                { name: 'Diamond',  threshold: 1500, color: '#88F0FF' },
              ];
              let current = tiers[0];
              let next = tiers[1];
              for (let i = 0; i < tiers.length; i++) {
                if (seasonXP >= tiers[i].threshold) { current = tiers[i]; next = tiers[i + 1] ?? null!; }
              }
              const pct = next
                ? Math.min(100, ((seasonXP - current.threshold) / (next.threshold - current.threshold)) * 100)
                : 100;
              return (
                <div className="card-paper p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="eyebrow-muted">LARP Level</p>
                    <span className="font-sans text-[10px] font-semibold tabular-nums text-gold-dark">{seasonXP} XP</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base text-forest">{current.name}</span>
                    {next && <span className="font-sans text-[10px] text-peat/40 tracking-wider">{next.name}</span>}
                  </div>
                  <div className="h-1.5 overflow-hidden bg-peat/10">
                    <div className="h-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${current.color}99, ${current.color})` }} />
                  </div>
                  {next && (
                    <p className="font-sans text-[10px] text-peat/40 mt-2 text-right tabular-nums">
                      {next.threshold - seasonXP} XP to {next.name}
                    </p>
                  )}
                  {!next && (
                    <p className="font-sans text-[10px] tracking-[0.2em] uppercase mt-2 text-center text-gold-dark">Max Tier Reached</p>
                  )}
                </div>
              );
            })()}

            <button
              onClick={() => setAddFriendOpen(true)}
              className="btn-editorial-ghost w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Members
            </button>

            {/* The standings — dotted-leader ledger */}
            <div className="card-paper p-5">
              <p className="eyebrow-muted mb-5">The Standings</p>
              <div className="space-y-3">
                {[
                  { value: plans.length, label: 'Total Plans', onClick: undefined },
                  { value: followingCount, label: 'Following', onClick: () => setFollowModal('following') },
                  { value: followerCount, label: 'Followers', onClick: () => setFollowModal('followers') },
                  { value: upcomingPlans.length, label: 'Upcoming', onClick: undefined },
                ].map(({ value, label, onClick }) => (
                  onClick ? (
                    <button key={label} onClick={onClick}
                      className="ledger-row w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm">
                      <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.25em] text-peat/45 group-hover:text-gold-dark transition-colors">{label}</span>
                      <span className="leader" />
                      <span className="shrink-0 font-display text-2xl leading-none text-forest tabular-nums group-hover:text-forest-light transition-colors">{value}</span>
                    </button>
                  ) : (
                    <div key={label} className="ledger-row">
                      <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.25em] text-peat/45">{label}</span>
                      <span className="leader" />
                      <span className="shrink-0 font-display text-2xl leading-none text-forest tabular-nums">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {upcomingPlans[0] && (
              <button className="w-full text-left rounded-[18px] border border-gold/30 bg-gold/[0.06] p-5 cursor-pointer hover:bg-gold/[0.1] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment" onClick={() => setSelectedPlan(upcomingPlans[0])}>
                <p className="eyebrow mb-3">Next LARP</p>
                <p className="font-display text-forest text-xl leading-snug mb-1">{upcomingPlans[0].spot_name}</p>
                {upcomingPlans[0].spot_neighborhood && (
                  <p className="font-sans text-xs text-peat/50 mb-2 tracking-wide">{upcomingPlans[0].spot_neighborhood}</p>
                )}
                <p className="font-sans text-xs text-gold-dark tracking-wide">
                  {new Date(upcomingPlans[0].plan_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {upcomingPlans[0].plan_time && ` · ${formatTime(upcomingPlans[0].plan_time)}`}
                </p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {mounted && editProfileOpen && (
        <EditProfileModal
          user={displayUser}
          showEmail={showEmail}
          onToggleShowEmail={toggleShowEmail}
          onSaved={handleProfileSaved}
          onClose={() => setEditProfileOpen(false)}
        />
      )}
      {mounted && addFriendOpen && (
        <AddFriendModal onClose={() => setAddFriendOpen(false)} onAdded={() => {}} />
      )}
      {mounted && selectedPlan && (
        <PlanDetailModal plan={selectedPlan} friends={friends} onClose={() => setSelectedPlan(null)} />
      )}
      {followModal && user.id && (
        <FollowListModal
          type={followModal}
          userId={user.id}
          isOwnProfile
          onClose={() => setFollowModal(null)}
          onStatsChange={() => {
            fetch(`/api/users/${user.id}/stats`).then(r => r.json()).then(d => {
              if (typeof d.followerCount === 'number') setFollowerCount(d.followerCount);
              if (typeof d.followingCount === 'number') setFollowingCount(d.followingCount);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, onDelete, deleting, onClick }: { plan: Plan; onDelete: (id: string) => void; deleting: boolean; onClick: () => void }) {
  const labelColor = plan.spot_category ? (CATEGORY_COLORS[plan.spot_category] ?? '#a8c8e8') : '#a8c8e8';
  const [copied, setCopied] = useState(false);

  function copyInviteLink(e: React.MouseEvent) {
    e.stopPropagation();
    if (!plan.invite_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${plan.invite_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-paper p-5 flex items-start gap-4 group cursor-pointer hover:shadow-[0_6px_32px_rgba(27, 47, 222,0.12)] transition-shadow"
      onClick={onClick}>
      <div className="shrink-0 text-center" style={{ minWidth: 38 }}>
        <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-gold-dark">
          {new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </p>
        <p className="font-display text-forest text-2xl leading-none">
          {new Date(plan.plan_date + 'T00:00:00').getDate()}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-forest text-lg leading-snug mb-0.5">{plan.spot_name}</p>
        {plan.spot_neighborhood && (
          <p className="font-sans text-xs mb-1.5 tracking-wide text-peat/50">{plan.spot_neighborhood}</p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {plan.plan_time && <span className="font-sans text-[10px] text-peat/45 tracking-wide">{formatTime(plan.plan_time)}</span>}
          {plan.spot_category && (
            <span className="font-sans text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 border text-peat/70"
              style={{ background: `${labelColor}30`, borderColor: `${labelColor}80` }}>
              {plan.spot_category}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {plan.invite_token && (
          <button
            onClick={copyInviteLink}
            title="Copy invite link"
            className={`opacity-0 group-hover:opacity-100 transition-all p-1 ${copied ? 'text-gold-dark' : 'text-peat/30 hover:text-gold-dark'}`}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }} disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-peat/25 hover:text-burgundy transition-all p-1">
          {deleting ? (
            <svg width="14" height="14" viewBox="0 0 14 14" className="animate-spin" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
