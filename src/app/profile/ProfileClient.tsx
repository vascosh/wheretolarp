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
      className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.35 }}
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
    <div className="rounded-2xl p-5 select-none"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full text-cream/40 hover:text-cream hover:bg-white/[0.06] transition-all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h3 className="font-serif text-cream text-base font-semibold">
          {MONTHS[viewMonth]} <span className="text-cream/35 font-normal text-sm">{viewYear}</span>
        </h3>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full text-cream/40 hover:text-cream hover:bg-white/[0.06] transition-all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center font-sans text-[10px] tracking-wider uppercase text-cream/20 py-1">{d}</div>
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
                isSelected ? 'bg-champagne/20 text-champagne border border-champagne/35'
                : isToday ? 'text-champagne border border-champagne/15 bg-champagne/[0.06]'
                : 'text-cream/55 hover:bg-white/[0.06] hover:text-cream border border-transparent'
              )}>
              <span className="leading-none">{day}</span>
              {hasPlan && (
                <span className={clsx('absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  isSelected ? 'bg-champagne' : 'bg-champagne/50')} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne/50 inline-block" />
          <span className="font-sans text-[10px] text-cream/25 tracking-wide">Plan saved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border border-champagne/15 bg-champagne/[0.06] inline-block" />
          <span className="font-sans text-[10px] text-cream/25 tracking-wide">Today</span>
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
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h2 className="font-serif text-cream text-lg font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="text-cream/30 hover:text-cream transition-colors p-1 rounded-full">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar name={name || 'U'} image={avatarUrl || null} size={56} />
              {uploading && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(7,15,26,0.7)' }}>
                  <div className="w-4 h-4 border-2 border-champagne/40 border-t-champagne rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">Profile Photo</p>
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
                className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-cream/50 font-sans text-xs tracking-widest uppercase hover:bg-white/[0.07] hover:text-cream/70 transition-all disabled:opacity-40"
              >
                {uploading ? 'Uploading…' : 'Choose Photo'}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-cream/35 mb-2">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/35 transition-all" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm text-cream/70 mb-0.5">Show email address</p>
              <p className="font-sans text-xs text-cream/25">Hide your email from the profile header.</p>
            </div>
            <button type="button" onClick={() => setEmailPrivacy(!emailPrivacy)}
              className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-4',
                emailPrivacy ? 'bg-champagne' : 'bg-white/10')}>
              <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                emailPrivacy ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
          {error && <p className="font-sans text-xs text-red-400/70">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-white/[0.08] text-cream/40 font-sans text-xs tracking-wider uppercase hover:text-cream/60 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-champagne/15 border border-champagne/25 text-champagne font-sans text-xs tracking-wider uppercase hover:bg-champagne/25 transition-all disabled:opacity-50">
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
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h2 className="font-serif text-cream text-lg font-semibold">Add Friend</h2>
          <button onClick={onClose} className="text-cream/30 hover:text-cream transition-colors p-1">
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
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-2.5 font-sans text-sm text-cream placeholder:text-cream/15 focus:outline-none focus:border-champagne/35 transition-all"
          />
        </div>
        <div className="px-6 pb-5 min-h-[60px]">
          {searching && (
            <p className="font-sans text-xs text-cream/25 mt-4 text-center">Searching…</p>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="font-sans text-xs text-cream/25 mt-4 text-center">No members found.</p>
          )}
          {results.map(r => {
            const isSent = sentIds.has(r.id) || r.status === 'pending_sent';
            const isAccepted = r.status === 'accepted';
            const isPendingReceived = r.status === 'pending_received';
            return (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                <Avatar name={r.name} image={r.avatar_url} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-cream/80 truncate">{r.name ?? 'Member'}</p>
                  {msgs[r.id] && <p className="font-sans text-[10px] text-red-400/60">{msgs[r.id]}</p>}
                </div>
                {isAccepted ? (
                  <span className="font-sans text-[10px] text-cream/30 tracking-widest uppercase">Friends</span>
                ) : isPendingReceived ? (
                  <button onClick={() => acceptRequest(r)}
                    className="px-3 py-1.5 rounded-full bg-champagne text-navy font-sans text-xs font-semibold hover:bg-champagne/90 transition-all">
                    Accept
                  </button>
                ) : isSent ? (
                  <span className="font-sans text-[10px] text-cream/30 tracking-widest uppercase">Sent</span>
                ) : (
                  <button onClick={() => sendRequest(r)}
                    className="px-3 py-1.5 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/20 transition-all">
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

  const labelColor = plan.spot_category ? (CATEGORY_COLORS[plan.spot_category] ?? '#a8c8e8') : '#a8c8e8';

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
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ background: '#0e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-cream text-xl font-semibold leading-snug mb-1">{plan.spot_name}</h2>
              {plan.spot_neighborhood && (
                <p className="font-sans text-xs text-cream/35">{plan.spot_neighborhood}</p>
              )}
            </div>
            <button onClick={onClose} className="text-cream/30 hover:text-cream transition-colors p-1 -mr-1 -mt-1">
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
              <span className="inline-block font-sans text-[9px] tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: `${labelColor}15`, color: labelColor, border: `1px solid ${labelColor}25` }}>
                {plan.spot_category}
              </span>
            )}
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-sm text-cream/70">{dateStr}</span>
            </div>
            {plan.plan_time && (
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/50 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-sm text-cream/70">{formatTime(plan.plan_time)}</span>
              </div>
            )}
            {plan.spot_description && (
              <p className="font-sans text-xs text-cream/30 leading-relaxed">{plan.spot_description}</p>
            )}
            {plan.notes && (
              <p className="font-sans text-xs text-cream/25 italic">{plan.notes}</p>
            )}
          </div>

          {/* Invite Friends section */}
          {friends.length > 0 && (
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-3">Invite Friends</p>
              <div className="space-y-2">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Avatar name={f.name} image={f.avatar_url} size={30} />
                    <p className="font-sans text-sm text-cream/60 flex-1 truncate">{f.name ?? f.email}</p>
                    {invitedFriends.has(f.id) ? (
                      <span className="font-sans text-[10px] text-champagne/60 tracking-wide flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Sent
                      </span>
                    ) : (
                      <button onClick={() => inviteFriend(f.id)} disabled={invitingFriend === f.id}
                        className="px-3 py-1 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-[10px] tracking-wider uppercase hover:bg-champagne/20 transition-all disabled:opacity-50">
                        {invitingFriend === f.id ? '…' : 'Invite'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {inviteError && <p className="font-sans text-xs text-red-400/60 mt-2">{inviteError}</p>}
            </div>
          )}

          {/* Share link + Google Calendar */}
          <div className="space-y-3 pt-2 border-t border-white/[0.05]">
            <button onClick={handleCopyLink} disabled={loadingToken}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-wider uppercase hover:bg-champagne/20 transition-all disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {loadingToken ? 'Getting link...' : copied ? 'Copied!' : 'Copy Invite Link'}
            </button>

            <a href={buildGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-white/[0.08] text-cream/40 font-sans text-xs tracking-wider uppercase hover:text-cream/60 hover:border-white/[0.15] transition-all">
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
    <div className="min-h-screen pt-nav"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* User header */}
        <div className="flex items-start gap-4 mb-8 sm:mb-10">
          <Avatar name={displayUser.name} image={displayUser.image} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-cream text-xl sm:text-2xl font-semibold leading-tight">{displayUser.name ?? 'Member'}</h1>
              <button onClick={() => setEditProfileOpen(true)}
                className="text-cream/20 hover:text-champagne transition-colors p-1 rounded-full hover:bg-white/[0.05]"
                title="Edit profile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {username && (
              <p className="font-sans text-champagne/50 text-xs tracking-wider">@{username}</p>
            )}
            {bio && (
              <p className="font-sans text-cream/45 text-sm leading-relaxed mt-1.5 max-w-sm">{bio}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-cream/25 hover:text-cream/50 font-sans text-xs tracking-wide transition-all duration-200">
              Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* Left */}
          <div className="space-y-6">
            <ProfileCalendar plans={plans} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

            {/* Plans for selected date */}
            {selectedDate && (
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-3">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {plansForSelectedDate.length === 0 ? (
                  <p className="font-sans text-sm text-cream/20 italic">Nothing planned.</p>
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
            <div className="flex border-b border-white/[0.06]">
              {(['plans', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={clsx(
                    'font-sans text-xs tracking-[0.12em] uppercase pb-3 mr-5 border-b-2 transition-all duration-200 capitalize',
                    activeTab === t ? 'border-champagne text-champagne' : 'border-transparent text-cream/25 hover:text-cream/50'
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
                    <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25">Friend Requests</p>
                    {pending.map(p => (
                      <div key={p.friendshipId} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: 'rgba(168,200,232,0.05)', border: '1px solid rgba(168,200,232,0.1)' }}>
                        <Avatar name={p.name} image={p.avatar_url} size={32} />
                        <p className="flex-1 font-sans text-sm text-cream/70 truncate">{p.name ?? 'Someone'}</p>
                        <button onClick={() => declineFriend(p.friendshipId)}
                          className="px-3 py-1.5 rounded-full border border-white/[0.1] text-cream/30 font-sans text-xs tracking-widest uppercase hover:text-cream/50 transition-all">
                          Decline
                        </button>
                        <button onClick={() => acceptFriend(p.friendshipId)}
                          className="px-3 py-1.5 rounded-full bg-champagne text-navy font-sans text-xs font-semibold hover:bg-champagne/90 transition-all">
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {upcomingPlans.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="font-serif text-cream/25 text-lg mb-2">No plans yet</p>
                    <p className="font-sans text-cream/15 text-xs mb-4">Browse a city and tap &ldquo;LARP here together&rdquo; to save.</p>
                    <Link href="/" className="inline-block px-5 py-2 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/20 transition-all">
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
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/30 mb-4">Edit Profile</p>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-sans text-sm text-cream/50 mb-3">Update your name, avatar, and privacy settings.</p>
                    <button onClick={() => setEditProfileOpen(true)}
                      className="px-5 py-2 rounded-full bg-champagne/15 border border-champagne/25 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/25 transition-all">
                      Edit Profile
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/30 mb-4">Privacy</p>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans text-sm text-cream/70 mb-0.5">Show email address</p>
                        <p className="font-sans text-xs text-cream/25 leading-relaxed">
                          When off, your email is hidden — useful while streaming or sharing your screen.
                        </p>
                      </div>
                      <button
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
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-4',
                          showEmail ? 'bg-champagne' : 'bg-white/10'
                        )}
                      >
                        <span className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
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
                { name: 'Gold',     threshold: 600,  color: '#C9A96E' },
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
                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25">LARP Level</p>
                    <span className="font-sans text-[10px] font-semibold tabular-nums" style={{ color: current.color }}>{seasonXP} XP</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs font-semibold" style={{ color: current.color }}>{current.name}</span>
                    {next && <span className="font-sans text-[10px] text-cream/25">{next.name}</span>}
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${current.color}99, ${current.color})`, boxShadow: `0 0 8px ${current.color}55` }} />
                  </div>
                  {next && (
                    <p className="font-sans text-[10px] text-cream/20 mt-2 text-right tabular-nums">
                      {next.threshold - seasonXP} XP to {next.name}
                    </p>
                  )}
                  {!next && (
                    <p className="font-sans text-[10px] mt-2 text-center" style={{ color: current.color }}>Max Tier Reached</p>
                  )}
                </div>
              );
            })()}

            <button
              onClick={() => setAddFriendOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-sans text-xs tracking-widest uppercase transition-colors"
              style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)', color: 'rgba(201,169,110,0.7)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,169,110,0.13)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,169,110,0.08)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Friends
            </button>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/25 mb-4">Stats</p>
              <div className="space-y-4">
                {[
                  { value: plans.length, label: 'Total Plans', onClick: undefined },
                  { value: followingCount, label: 'Following', onClick: () => setFollowModal('following') },
                  { value: followerCount, label: 'Followers', onClick: () => setFollowModal('followers') },
                  { value: upcomingPlans.length, label: 'Upcoming', onClick: undefined },
                ].map(({ value, label, onClick }, i, arr) => (
                  <div key={label}>
                    {onClick ? (
                      <button onClick={onClick} className="text-left group w-full">
                        <p className="font-serif text-champagne text-3xl font-semibold leading-none group-hover:text-champagne/70 transition-colors">{value}</p>
                        <p className="font-sans text-[10px] tracking-widest uppercase text-cream/25 mt-1 group-hover:text-cream/40 transition-colors underline underline-offset-2 decoration-cream/10">{label}</p>
                      </button>
                    ) : (
                      <>
                        <p className="font-serif text-champagne text-3xl font-semibold leading-none">{value}</p>
                        <p className="font-sans text-[10px] tracking-widest uppercase text-cream/25 mt-1">{label}</p>
                      </>
                    )}
                    {i < arr.length - 1 && <div className="h-px bg-white/[0.05] mt-4" />}
                  </div>
                ))}
              </div>
            </div>

            {upcomingPlans[0] && (
              <div className="rounded-2xl p-5 cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setSelectedPlan(upcomingPlans[0])}
                style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.1)' }}>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-champagne/40 mb-3">Next LARP</p>
                <p className="font-serif text-cream text-base font-semibold leading-snug mb-1">{upcomingPlans[0].spot_name}</p>
                {upcomingPlans[0].spot_neighborhood && (
                  <p className="font-sans text-xs text-cream/35 mb-2">{upcomingPlans[0].spot_neighborhood}</p>
                )}
                <p className="font-sans text-xs text-champagne/50">
                  {new Date(upcomingPlans[0].plan_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {upcomingPlans[0].plan_time && ` · ${formatTime(upcomingPlans[0].plan_time)}`}
                </p>
              </div>
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
    <div className="rounded-2xl p-5 flex items-start gap-4 group cursor-pointer hover:bg-white/[0.04] transition-colors"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      onClick={onClick}>
      <div className="shrink-0 text-center" style={{ minWidth: 38 }}>
        <p className="font-sans text-[9px] tracking-widest uppercase" style={{ color: labelColor }}>
          {new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </p>
        <p className="font-serif text-cream text-2xl font-semibold leading-none">
          {new Date(plan.plan_date + 'T00:00:00').getDate()}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-cream text-base font-semibold leading-snug mb-0.5">{plan.spot_name}</p>
        {plan.spot_neighborhood && (
          <p className="font-sans text-xs mb-1.5" style={{ color: labelColor, opacity: 0.6 }}>{plan.spot_neighborhood}</p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {plan.plan_time && <span className="font-sans text-[10px] text-cream/25">{formatTime(plan.plan_time)}</span>}
          {plan.spot_category && (
            <span className="font-sans text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${labelColor}12`, color: labelColor }}>
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
            className={`opacity-0 group-hover:opacity-100 transition-all p-1 ${copied ? 'text-champagne' : 'text-cream/20 hover:text-champagne/60'}`}
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
          className="opacity-0 group-hover:opacity-100 text-cream/15 hover:text-red-400/50 transition-all p-1">
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
