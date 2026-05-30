'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import clsx from 'clsx';

interface OtherUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface Conversation {
  id: string;
  other: OtherUser;
  lastMessage: { content: string | null; type: string; createdAt: string; isFromMe: boolean } | null;
  unreadCount: number;
  lastMessageAt: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  media_name: string | null;
  created_at: string;
}

interface LarpPlan {
  id: string;
  spot_name: string;
  spot_neighborhood: string | null;
  spot_category: string | null;
  spot_description: string | null;
  plan_date: string;
  plan_time: string | null;
  notes: string | null;
  invite_token?: string | null;
}

interface DMSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialConvId?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, image, size = 36 }: { name?: string | null; image?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [image]);
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (image && !err) {
    return (
      <img src={image} alt={name ?? ''} referrerPolicy="no-referrer"
        onError={() => setErr(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (now.toDateString() === d.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBubbleTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (now.toDateString() === d.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function isURL(str: string) {
  try { new URL(str.trim()); return /^https?:\/\//.test(str.trim()); } catch { return false; }
}

function lastMsgPreview(lm: Conversation['lastMessage']) {
  if (!lm) return '';
  if (lm.type === 'image') return '📷 Photo';
  if (lm.type === 'video') return '🎬 Video';
  if (lm.type === 'file') return '📎 File';
  if (lm.type === 'plan') return '📅 LARP Plan';
  if (lm.type === 'link') return lm.content ?? '';
  return lm.content ?? '';
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, isMe }: { plan: LarpPlan; isMe: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'accepted' | 'declined' | 'added'>('idle');
  const isInvite = !isMe && !!plan.invite_token;

  async function accept() {
    if (status !== 'idle') return;
    setStatus('loading');
    if (isInvite) {
      const res = await fetch(`/api/invites/${plan.invite_token}`, { method: 'PATCH' });
      setStatus(res.ok ? 'accepted' : 'idle');
    } else {
      const res = await fetch('/api/plans/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      setStatus(res.ok ? 'added' : 'idle');
    }
  }

  async function decline() {
    if (status !== 'idle') return;
    setStatus('loading');
    const res = await fetch(`/api/invites/${plan.invite_token}`, { method: 'DELETE' });
    setStatus(res.ok ? 'declined' : 'idle');
  }

  const dateStr = plan.plan_date
    ? new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="rounded-2xl overflow-hidden min-w-[220px] max-w-[260px]"
      style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
      <div className="px-4 py-3 border-b border-champagne/[0.12]">
        <div className="flex items-center gap-2 mb-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-champagne/60 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-sans text-[10px] text-champagne/50 tracking-widest uppercase">
            {isInvite ? 'Plan Invite' : 'LARP Plan'}
          </span>
        </div>
        <p className="font-serif text-cream text-sm font-semibold leading-snug">{plan.spot_name}</p>
        {plan.spot_neighborhood && (
          <p className="font-sans text-[11px] text-cream/40 mt-0.5">{plan.spot_neighborhood}</p>
        )}
      </div>
      <div className="px-4 py-2.5">
        {dateStr && (
          <p className="font-sans text-xs text-cream/60 mb-0.5">
            {dateStr}{plan.plan_time ? ` · ${plan.plan_time}` : ''}
          </p>
        )}
        {plan.spot_category && (
          <p className="font-sans text-[10px] text-cream/30 capitalize">{plan.spot_category}</p>
        )}
        {!isMe && (
          <>
            {status === 'accepted' && (
              <p className="font-sans text-[11px] text-green-400/80 mt-3">Added to your calendar</p>
            )}
            {status === 'added' && (
              <p className="font-sans text-[11px] text-green-400/80 mt-3">Added to your calendar</p>
            )}
            {status === 'declined' && (
              <p className="font-sans text-[11px] text-cream/30 mt-3 italic">Invite declined</p>
            )}
            {(status === 'idle' || status === 'loading') && (
              isInvite ? (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={accept}
                    disabled={status === 'loading'}
                    className="flex-1 py-1.5 rounded-full bg-champagne text-navy font-sans text-[11px] tracking-wider uppercase font-semibold hover:bg-champagne/90 disabled:opacity-50 transition-all">
                    {status === 'loading' ? '…' : 'Accept'}
                  </button>
                  <button
                    onClick={decline}
                    disabled={status === 'loading'}
                    className="flex-1 py-1.5 rounded-full border border-white/[0.12] text-cream/40 font-sans text-[11px] tracking-wider uppercase hover:text-cream/70 hover:border-white/[0.2] disabled:opacity-50 transition-all">
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  onClick={accept}
                  disabled={status === 'loading'}
                  className="mt-3 w-full py-1.5 rounded-full bg-champagne text-navy font-sans text-[11px] tracking-wider uppercase font-semibold hover:bg-champagne/90 disabled:opacity-50 transition-all">
                  {status === 'loading' ? 'Adding…' : 'Add to Calendar'}
                </button>
              )
            )}
          </>
        )}
        {isMe && (
          <p className="font-sans text-[10px] text-cream/20 mt-2 italic">Shared with friend</p>
        )}
      </div>
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  // Plan message — special card layout
  if (msg.message_type === 'plan' && msg.content) {
    try {
      const plan: LarpPlan = JSON.parse(msg.content);
      return (
        <div className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}>
          <PlanCard plan={plan} isMe={isMe} />
        </div>
      );
    } catch {
      // fallthrough to text
    }
  }

  return (
    <div className={clsx('max-w-[78%] rounded-3xl px-4 py-2.5 break-words',
      isMe ? 'rounded-br-md bg-champagne/[0.18] border border-champagne/25 text-cream' : 'rounded-bl-md text-cream/85')}
      style={!isMe ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' } : {}}>

      {msg.message_type === 'image' && msg.media_url && (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={msg.media_url} alt="Photo"
            className="rounded-xl max-w-full max-h-52 object-cover" />
        </a>
      )}

      {msg.message_type === 'video' && msg.media_url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={msg.media_url} controls className="rounded-xl max-w-full max-h-52" />
      )}

      {msg.message_type === 'file' && msg.media_url && (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 py-0.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(201,169,110,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/60">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-sans text-xs text-champagne/70 hover:text-champagne transition-colors truncate max-w-[160px]">
            {msg.media_name ?? 'File'}
          </span>
        </a>
      )}

      {msg.message_type === 'link' && msg.content && (
        <a href={msg.content} target="_blank" rel="noopener noreferrer"
          className="font-sans text-sm underline underline-offset-2 break-all text-champagne/80 hover:text-champagne transition-colors">
          {msg.content}
        </a>
      )}

      {(msg.message_type === 'text' || (msg.message_type !== 'link' && msg.content)) && msg.content && (
        <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DMSidebar({ isOpen, onClose, initialConvId }: DMSidebarProps) {
  const { data: session } = useSession();
  const myId = session?.user?.id;

  const [view, setView] = useState<'list' | 'thread'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [attached, setAttached] = useState<{ file: File; preview?: string; type: string; name: string } | null>(null);
  const [pendingPlan, setPendingPlan] = useState<LarpPlan | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [myPlans, setMyPlans] = useState<LarpPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── data fetching ───────────────────────────────────────────────────────────

  const fetchConvs = useCallback(async () => {
    if (!myId) return;
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const d = await res.json();
      setConversations(d.conversations ?? []);
    }
  }, [myId]);

  const fetchMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages ?? []);
    }
  }, []);

  // Load conversations when sidebar opens
  useEffect(() => {
    if (!isOpen || !myId) return;
    setLoadingConvs(true);
    fetchConvs().finally(() => setLoadingConvs(false));
  }, [isOpen, myId, fetchConvs]);

  // Auto-open a specific conversation (e.g. from a notification click)
  useEffect(() => {
    if (!initialConvId || !isOpen || conversations.length === 0) return;
    const found = conversations.find(c => c.id === initialConvId);
    if (found) openConversation(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConvId, isOpen, conversations]);

  // Poll messages when in thread view
  useEffect(() => {
    if (view !== 'thread' || !selectedConv) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    fetchMessages(selectedConv.id);
    pollRef.current = setInterval(() => fetchMessages(selectedConv.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [view, selectedConv, fetchMessages]);

  // Scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Escape key handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (view === 'thread') backToList();
      else onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, onClose]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  // ── actions ─────────────────────────────────────────────────────────────────

  async function openConversation(conv: Conversation) {
    setSelectedConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    setView('thread');
    await fetchMessages(conv.id);
    setLoadingMsgs(false);
    setConversations(cs => cs.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  }

  function backToList() {
    if (pollRef.current) clearInterval(pollRef.current);
    setView('list');
    setSelectedConv(null);
    setMessages([]);
    setText('');
    setAttached(null);
    setPendingPlan(null);
    fetchConvs();
  }

  async function openPlanPicker() {
    setShowPlanPicker(true);
    if (myPlans.length > 0) return;
    setLoadingPlans(true);
    const res = await fetch('/api/plans');
    if (res.ok) {
      const d = await res.json();
      setMyPlans(d.plans ?? []);
    }
    setLoadingPlans(false);
  }

  function selectPlan(plan: LarpPlan) {
    setPendingPlan(plan);
    setShowPlanPicker(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let preview: string | undefined;
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      preview = URL.createObjectURL(file);
    }
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    setAttached({ file, preview, type, name: file.name });
  }

  function removeAttachment() {
    setAttached(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSend() {
    if (!selectedConv || (!text.trim() && !attached && !pendingPlan) || sending) return;
    setSending(true);

    // Handle plan share
    if (pendingPlan) {
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        sender_id: myId!,
        content: JSON.stringify(pendingPlan),
        message_type: 'plan',
        media_url: null,
        media_name: null,
        created_at: new Date().toISOString(),
      };
      setMessages(ms => [...ms, optimistic]);
      const sentPlan = pendingPlan;
      setPendingPlan(null);

      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(sentPlan), message_type: 'plan' }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages(ms => ms.map(m => m.id === tempId ? message : m));
      } else {
        setMessages(ms => ms.filter(m => m.id !== tempId));
        setPendingPlan(sentPlan);
      }
      setSending(false);
      return;
    }

    // Optimistic local message
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: myId!,
      content: text.trim() || null,
      message_type: attached?.type ?? (isURL(text.trim()) ? 'link' : 'text'),
      media_url: attached?.preview ?? null,
      media_name: attached?.name ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages(ms => [...ms, optimistic]);
    const sentText = text;
    const sentAttached = attached;
    setText('');
    setAttached(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;
      let messageType = isURL(sentText.trim()) ? 'link' : 'text';

      if (sentAttached) {
        const fd = new FormData();
        fd.append('file', sentAttached.file);
        const upRes = await fetch('/api/messages/upload', { method: 'POST', body: fd });
        if (upRes.ok) {
          const upData = await upRes.json();
          mediaUrl = upData.url;
          mediaName = upData.name;
          messageType = upData.type;
        } else {
          // Revert optimistic if upload fails
          setMessages(ms => ms.filter(m => m.id !== tempId));
          setText(sentText);
          setAttached(sentAttached);
          setSending(false);
          return;
        }
      }

      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sentText.trim() || null,
          message_type: messageType,
          media_url: mediaUrl,
          media_name: mediaName,
        }),
      });

      if (res.ok) {
        const { message } = await res.json();
        // Replace optimistic with real message
        setMessages(ms => ms.map(m => m.id === tempId ? message : m));
        // Update conversation preview
        setConversations(cs => cs.map(c => c.id === selectedConv.id ? {
          ...c,
          lastMessage: {
            content: message.content,
            type: message.message_type,
            createdAt: message.created_at,
            isFromMe: true,
          },
          lastMessageAt: message.created_at,
        } : c));
      } else {
        setMessages(ms => ms.filter(m => m.id !== tempId));
        setText(sentText);
        setAttached(sentAttached);
      }
    } catch {
      setMessages(ms => ms.filter(m => m.id !== tempId));
      setText(sentText);
      setAttached(sentAttached);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-navy/40 backdrop-blur-[2px]"
        onClick={() => { if (view === 'thread') backToList(); else onClose(); }}
      />

      {/* Floating bubble panel — softly rounded, detached from screen edges */}
      <div
        className="fixed z-[401] flex flex-col left-3 right-3 sm:left-auto sm:right-6 sm:w-[400px] rounded-3xl overflow-hidden border border-champagne/15 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        style={{
          background: '#07111d',
          top: 'calc(4.5rem + env(safe-area-inset-top))',
          bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Conversations list ─────────────────────────────────────────── */}
        {view === 'list' && (
          <>
            <div className="px-5 py-5 border-b border-white/[0.07] flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif text-cream text-xl font-semibold">Messages</h2>
                {totalUnread > 0 && (
                  <p className="font-sans text-[10px] text-champagne/50 mt-0.5 tracking-wide">{totalUnread} unread</p>
                )}
              </div>
              <button onClick={onClose}
                className="text-cream/30 hover:text-cream transition-colors p-2 rounded-full hover:bg-white/[0.06]">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-5 h-5 border-2 border-champagne/20 border-t-champagne rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 px-8 text-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-champagne/40">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans text-cream/30 text-sm mb-1">No messages yet</p>
                    <p className="font-sans text-cream/15 text-xs leading-relaxed">
                      Visit a friend&apos;s profile to start a conversation
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {conversations.map(conv => (
                    <button key={conv.id} onClick={() => openConversation(conv)}
                      className="w-full px-4 py-4 flex items-center gap-3 hover:bg-white/[0.04] transition-all text-left">
                      <div className="relative shrink-0">
                        <Avatar name={conv.other.name} image={conv.other.avatar_url} size={44} />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-champagne rounded-full text-[9px] text-navy flex items-center justify-center font-bold px-0.5">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={clsx('font-sans text-sm truncate',
                            conv.unreadCount > 0 ? 'text-cream font-semibold' : 'text-cream/70')}>
                            {conv.other.name ?? conv.other.username ?? 'Unknown'}
                          </p>
                          {conv.lastMessage && (
                            <span className="font-sans text-[10px] text-cream/25 shrink-0 ml-2">
                              {formatMsgTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={clsx('font-sans text-xs truncate',
                            conv.unreadCount > 0 ? 'text-cream/60' : 'text-cream/30')}>
                            {conv.lastMessage.isFromMe && <span className="text-cream/20">You: </span>}
                            {lastMsgPreview(conv.lastMessage)}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Message thread ────────────────────────────────────────────── */}
        {view === 'thread' && selectedConv && (
          <>
            {/* Thread header */}
            <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
              <button onClick={backToList}
                className="text-cream/30 hover:text-cream transition-colors p-1.5 rounded-full hover:bg-white/[0.06] shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <Link href={`/u/${selectedConv.other.id}`} onClick={onClose} className="shrink-0">
                <Avatar name={selectedConv.other.name} image={selectedConv.other.avatar_url} size={36} />
              </Link>
              <Link href={`/u/${selectedConv.other.id}`} onClick={onClose} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <p className="font-sans text-sm text-cream/85 font-medium truncate">
                  {selectedConv.other.name ?? selectedConv.other.username ?? 'Unknown'}
                </p>
                {selectedConv.other.username && (
                  <p className="font-sans text-[10px] text-cream/30 leading-none mt-0.5">@{selectedConv.other.username}</p>
                )}
              </Link>
              <button onClick={onClose}
                className="text-cream/20 hover:text-cream/50 transition-colors p-1.5 rounded-full shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-5 h-5 border-2 border-champagne/20 border-t-champagne rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                  <p className="font-sans text-cream/20 text-sm">Start the conversation</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === myId;
                    const prev = messages[i - 1];
                    const showTimestamp = !prev ||
                      (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60 * 1000;
                    const sameAsPrev = prev && prev.sender_id === msg.sender_id;

                    return (
                      <div key={msg.id} className={clsx(!sameAsPrev && i > 0 ? 'mt-3' : '')}>
                        {showTimestamp && (
                          <div className="text-center py-2">
                            <span className="font-sans text-[10px] text-cream/20 px-3 py-1 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.03)' }}>
                              {formatBubbleTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={clsx('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                          {!isMe && !sameAsPrev && (
                            <Avatar name={selectedConv.other.name} image={selectedConv.other.avatar_url} size={24} />
                          )}
                          {!isMe && sameAsPrev && <div style={{ width: 24 }} />}
                          <MessageBubble msg={msg} isMe={isMe} />
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Plan picker modal */}
            {showPlanPicker && (
              <div className="mx-4 mb-2 rounded-xl overflow-hidden"
                style={{ background: '#0a1628', border: '1px solid rgba(201,169,110,0.2)' }}>
                <div className="px-4 py-3 border-b border-champagne/[0.1] flex items-center justify-between">
                  <p className="font-serif text-cream/80 text-xs font-semibold">Share a Plan</p>
                  <button onClick={() => setShowPlanPicker(false)}
                    className="text-cream/30 hover:text-cream/60 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {loadingPlans ? (
                    <div className="flex items-center justify-center h-16">
                      <div className="w-4 h-4 border-2 border-champagne/20 border-t-champagne rounded-full animate-spin" />
                    </div>
                  ) : myPlans.length === 0 ? (
                    <p className="font-sans text-cream/20 text-xs text-center py-6">No plans yet</p>
                  ) : (
                    myPlans.map(plan => (
                      <button key={plan.id} onClick={() => selectPlan(plan)}
                        className="w-full px-4 py-3 text-left hover:bg-champagne/[0.06] transition-all border-b border-white/[0.04] last:border-0">
                        <p className="font-serif text-cream/80 text-xs font-semibold truncate">{plan.spot_name}</p>
                        <p className="font-sans text-[10px] text-cream/30 mt-0.5">
                          {new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {plan.spot_neighborhood ? ` · ${plan.spot_neighborhood}` : ''}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Pending plan preview */}
            {pendingPlan && (
              <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-champagne/60 shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-cream/70 font-semibold truncate">{pendingPlan.spot_name}</p>
                  <p className="font-sans text-[10px] text-cream/30">
                    {new Date(pendingPlan.plan_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setPendingPlan(null)}
                  className="text-cream/30 hover:text-cream/60 transition-colors p-1 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Attachment preview */}
            {attached && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {attached.type === 'image' && attached.preview ? (
                  <img src={attached.preview} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : attached.type === 'video' && attached.preview ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={attached.preview} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,169,110,0.1)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-champagne/50">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-cream/60 truncate">{attached.name}</p>
                  <p className="font-sans text-[10px] text-cream/25">
                    {(attached.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button onClick={removeAttachment}
                  className="text-cream/30 hover:text-cream/60 transition-colors p-1 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Composer */}
            <div className="px-4 pt-2 pb-3 border-t border-white/[0.07] shrink-0">
              <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-full text-cream/30 hover:text-champagne hover:bg-champagne/[0.08] transition-all shrink-0 mb-0.5"
                  title="Attach file">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button onClick={openPlanPicker}
                  className={clsx(
                    'p-2.5 rounded-full transition-all shrink-0 mb-0.5',
                    showPlanPicker || pendingPlan
                      ? 'text-champagne bg-champagne/[0.12]'
                      : 'text-cream/30 hover:text-champagne hover:bg-champagne/[0.08]'
                  )}
                  title="Share a plan">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.mp3,.mp4"
                  onChange={handleFileSelect} />

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message…"
                  rows={1}
                  className="flex-1 resize-none rounded-2xl px-3.5 py-2.5 font-sans text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-champagne/30 transition-all overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    lineHeight: '1.5',
                    minHeight: '40px',
                    maxHeight: '120px',
                  }}
                />

                <button onClick={handleSend}
                  disabled={(!text.trim() && !attached && !pendingPlan) || sending}
                  className={clsx(
                    'p-2.5 rounded-full transition-all shrink-0 mb-0.5',
                    (text.trim() || attached || pendingPlan) && !sending
                      ? 'bg-champagne text-navy hover:bg-champagne/90 shadow-sm'
                      : 'bg-white/[0.05] text-cream/20 cursor-not-allowed'
                  )}>
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="font-sans text-[10px] text-cream/15 mt-2 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
