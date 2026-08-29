'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

interface Props {
  targetId: string;
  targetName: string | null;
  showMessage?: boolean;
}

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or fake account' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fake_account', label: 'Impersonation' },
  { value: 'underage', label: 'Underage user' },
  { value: 'other', label: 'Other' },
];

function ReportModal({ targetName, onClose, onSubmit }: {
  targetName: string | null;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason, details);
    setSubmitting(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/40 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[18px] border border-peat/10 bg-parchment-light shadow-[0_12px_48px_rgba(16, 17, 20,0.22)]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/15">
          <div>
            <p className="eyebrow mb-1">Member Conduct</p>
            <h2 className="headline-editorial text-2xl">Report</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-peat/35 hover:text-gold-dark transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full border border-forest/25 bg-forest-pale/60 flex items-center justify-center mx-auto mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-forest">
                <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="headline-editorial text-2xl mb-2">Report filed</h3>
            <p className="font-sans text-peat/60 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              The Society will review the matter and act as required.
            </p>
            <button onClick={onClose}
              className="btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div>
              <p className="font-sans text-xs text-peat/60 mb-4 leading-relaxed">
                Reporting <span className="font-display italic text-forest">{targetName ?? 'this member'}</span>
              </p>
              <div className="space-y-2">
                {REPORT_REASONS.map(r => (
                  <label key={r.value}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border rounded-[10px]',
                      reason === r.value
                        ? 'bg-gold/[0.08] border-gold/40'
                        : 'border-peat/10 hover:border-gold/30'
                    )}>
                    <input type="radio" name="reason" value={r.value}
                      checked={reason === r.value} onChange={() => setReason(r.value)}
                      className="sr-only" />
                    <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      reason === r.value ? 'border-gold-dark' : 'border-peat/25')}>
                      {reason === r.value && <div className="w-2 h-2 rounded-full bg-gold-dark" />}
                    </div>
                    <span className="font-sans text-sm text-peat/80">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="report-details" className="eyebrow-muted block mb-2">
                Additional details (optional)
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe what happened…"
                className="w-full bg-transparent border-b border-peat/20 px-0 py-2.5 font-sans text-base text-peat placeholder:text-peat/30 focus:outline-none focus:border-gold transition-all resize-none"
              />
            </div>

            <div className="flex gap-4 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                Cancel
              </button>
              <button type="submit" disabled={!reason || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-burgundy/40 text-burgundy font-sans text-[11px] font-semibold tracking-[0.25em] uppercase transition-all hover:border-burgundy hover:bg-burgundy/5 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UserActions({ targetId, targetName, showMessage = false }: Props) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${targetId}/block`)
      .then(r => r.json())
      .then(d => setBlocked(d.blocked ?? false))
      .catch(() => {});
  }, [session?.user?.id, targetId]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function toggleBlock() {
    setBlocking(true);
    setMenuOpen(false);
    const method = blocked ? 'DELETE' : 'POST';
    const res = await fetch(`/api/users/${targetId}/block`, { method });
    if (res.ok) setBlocked(!blocked);
    setBlocking(false);
  }

  async function handleMessage() {
    setMessaging(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const d = await res.json();
      if (d.conversationId) {
        window.dispatchEvent(new CustomEvent('openDM', { detail: { convId: d.conversationId } }));
      }
    } catch {}
    setMessaging(false);
  }

  async function submitReport(reason: string, details: string) {
    await fetch(`/api/users/${targetId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details }),
    });
  }

  if (!session?.user?.id || session.user.id === targetId) return null;

  return (
    <>
      <div className="flex items-center gap-3 mt-6 justify-center">
        {showMessage && (
          <button onClick={handleMessage} disabled={messaging}
            className="btn-editorial-ghost disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {messaging ? '…' : 'Message'}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(o => !o)}
            className="p-2.5 border border-forest/25 text-peat/50 hover:text-forest hover:border-forest/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light"
            aria-label="More actions" title="More actions">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden z-50 rounded-[12px] border border-peat/10 bg-parchment-light shadow-[0_10px_36px_rgba(16, 17, 20,0.18)]">
              <button onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 font-sans text-[11px] tracking-[0.15em] uppercase text-peat/60 hover:text-gold-dark hover:bg-gold/[0.07] transition-all text-left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Report member
              </button>
              <div className="h-px bg-forest/10" />
              <button onClick={toggleBlock} disabled={blocking}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-4 py-3 font-sans text-[11px] tracking-[0.15em] uppercase transition-all text-left',
                  blocked
                    ? 'text-peat/60 hover:text-gold-dark hover:bg-gold/[0.07]'
                    : 'text-burgundy/80 hover:text-burgundy hover:bg-burgundy/[0.06]',
                  blocking && 'opacity-50'
                )}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {blocked ? 'Unblock member' : 'Block member'}
              </button>
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportModal
          targetName={targetName}
          onClose={() => setReportOpen(false)}
          onSubmit={submitReport}
        />
      )}
    </>
  );
}
