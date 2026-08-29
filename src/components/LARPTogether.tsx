'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Calendar } from '@/components/ui/calendar-rac';
import { parseDate, today as getToday, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';

interface LARPTogetherProps {
  name: string;
  neighborhood?: string | null;
  description?: string | null;
  category?: string;
  prefillDate?: string;
  prefillTime?: string;
}

function formatReadableDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatReadableTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `${hour}${mins} ${period}`;
}

const TIME_OPTIONS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00',
];

function LARPTogetherModal({
  name,
  neighborhood,
  description,
  category,
  prefillDate,
  prefillTime,
  onClose,
}: LARPTogetherProps & { onClose: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(prefillDate ?? '');
  const [time, setTime] = useState(prefillTime ?? '19:00');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  async function handleSave() {
    if (!date) return;
    if (!session) {
      onClose();
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot_name: name,
          spot_neighborhood: neighborhood,
          spot_category: category,
          spot_description: description,
          plan_date: date,
          plan_time: time,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? 'Failed to save.');
      } else {
        const d = await res.json();
        setInviteToken(d.plan?.invite_token ?? null);
        setSaved(true);
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-forest/60 backdrop-blur-[8px] animate-backdrop-enter" onClick={onClose} />

      <div className="relative z-10 bg-parchment-light w-full max-w-md rounded-[18px] shadow-modal overflow-hidden animate-modal-enter flex flex-col max-h-[85vh] border border-gold/30">
        {/* Header */}
        <div className="relative bg-parchment px-6 py-7 sm:px-8 sm:py-8 shrink-0 border-b border-gold/20">
          <span className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-gold to-transparent" />
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow mb-3">LARP Here</p>
              <h2 className="headline-editorial text-3xl sm:text-4xl">{name}</h2>
            </div>
            <button onClick={onClose} className="text-peat/35 hover:text-gold-dark transition-colors duration-200 p-1 -mr-1 -mt-1 rounded-full">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 5L17 17M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success state */}
        {saved ? (
          <div className="p-8 text-center flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold-dark">
                <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-forest text-xl mb-1">Plan Saved</h3>
              <p className="font-sans text-peat/60 text-sm">
                Added to your calendar for {formatReadableDate(date)} at {formatReadableTime(time)}.
              </p>
            </div>

            {/* Invite link */}
            {inviteToken && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteToken}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full border font-sans text-xs tracking-wider uppercase transition-all w-full justify-center',
                  copied
                    ? 'border-gold/50 bg-gold/10 text-gold-dark'
                    : 'border-peat/15 text-peat/50 hover:border-gold/50 hover:text-gold-dark hover:bg-gold/5'
                )}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Link Copied
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Copy Invite Link
                  </>
                )}
              </button>
            )}

            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-peat/20 font-sans text-xs tracking-wider uppercase text-peat/60 hover:border-peat/40 transition-all">
                Close
              </button>
              <a href="/profile" className="flex-1 py-2.5 rounded-full bg-forest text-parchment-light font-sans text-xs font-semibold tracking-wider uppercase hover:bg-forest-light transition-all text-center">
                My Plans
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-6 sm:px-8 sm:py-8 space-y-6">

            {/* Date + Time row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={dateRef} className="relative">
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-peat/50 mb-2">
                  Date <span className="text-gold-dark">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(o => !o)}
                  className={clsx(
                    'w-full flex items-center justify-between border rounded-lg px-3 py-2.5 font-sans text-sm transition-all bg-parchment-light',
                    calendarOpen ? 'border-gold text-peat' : 'border-peat/15 text-peat hover:border-gold/50',
                    !date && 'text-peat/30'
                  )}
                >
                  <span>
                    {date
                      ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Pick a date'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={clsx('text-peat/40 transition-transform duration-200', calendarOpen && 'rotate-180')}>
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {calendarOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-gold/30 shadow-modal animate-modal-enter overflow-hidden"
                    style={{ background: '#1B2FDE' }}
                  >
                    <div className="p-3">
                      <Calendar
                        minValue={getToday(getLocalTimeZone())}
                        value={date ? parseDate(date) : undefined}
                        onChange={(val: DateValue) => {
                          setDate(val.toString());
                          setCalendarOpen(false);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-peat/50 mb-2">Time</label>
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full border border-peat/15 rounded-lg px-3 py-2.5 text-sm font-sans text-peat bg-parchment-light focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238A8578' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{formatReadableTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info blurb */}
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(75, 93, 240,0.06)', border: '1px solid rgba(75, 93, 240,0.18)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold/70 shrink-0 mt-0.5">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="font-sans text-xs text-peat/70 leading-relaxed">
                {session
                  ? 'Saves this LARP to your profile calendar. You can view and manage it in your account.'
                  : 'Sign in to save this plan to your personal LARP calendar.'}
              </p>
            </div>

            {saveError && (
              <p className="font-sans text-xs text-burgundy">{saveError}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleSave}
              disabled={!date || saving}
              className={clsx(
                'w-full py-3.5 text-[11px] font-sans font-semibold tracking-[0.22em] uppercase transition-all duration-300',
                date && !saving
                  ? 'bg-forest text-parchment-light hover:bg-forest-light cursor-pointer'
                  : 'bg-peat/10 text-peat/30 cursor-not-allowed'
              )}
            >
              {saving ? 'Saving…' : session ? 'Save to My Calendar' : 'Sign In to Save'}
            </button>

            <p className="font-sans text-[11px] text-peat/45 text-center leading-relaxed">
              View and manage all your plans from your profile.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function LARPTogether({
  name,
  neighborhood,
  description,
  category,
  prefillDate,
  prefillTime,
}: LARPTogetherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setIsOpen(true); }}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-3
          border border-gold/40 text-gold-dark hover:border-gold hover:bg-gold/[0.06]
          font-sans text-[11px] tracking-[0.22em] uppercase transition-all duration-300"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        LARP here
      </button>

      {mounted && isOpen && (
        <LARPTogetherModal
          name={name}
          neighborhood={neighborhood}
          description={description}
          category={category}
          prefillDate={prefillDate}
          prefillTime={prefillTime}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
