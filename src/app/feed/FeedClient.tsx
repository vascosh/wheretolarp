'use client';

/**
 * Feed: a single-column Instagram-style stream of LARP posts, styled to
 * match the bento landing (navy + champagne accents on cream text).
 *
 * Visibility is server-enforced in /api/posts (own + friends + public).
 * Ranking is server-side too. The page itself just renders, likes, shares,
 * and lets the author delete their own posts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import NewPostModal from '@/components/NewPostModal';
import FeedDMLauncher from '@/components/FeedDMLauncher';
import SharePostModal from '@/components/SharePostModal';
import Reveal from '@/components/Reveal';

interface Author {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  public: boolean;
}
interface FeedPost {
  id: string;
  image_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  city_slug: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_place_id: string | null;
  like_count: number;
  share_count: number;
  created_at: string;
  liked: boolean;
  is_friend: boolean;
  is_own: boolean;
  author: Author;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedClient() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState<FeedPost | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {/* ignore */}
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  async function toggleLike(post: FeedPost) {
    if (!session?.user?.id) return;
    if (pending.has(post.id)) return;
    setPending((s) => new Set(s).add(post.id));

    // Optimistic
    setPosts((cur) =>
      cur?.map((p) =>
        p.id === post.id
          ? { ...p, liked: !p.liked, like_count: p.like_count + (p.liked ? -1 : 1) }
          : p
      ) ?? cur
    );

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts((cur) =>
          cur?.map((p) =>
            p.id === post.id
              ? { ...p, liked: data.liked, like_count: data.like_count ?? p.like_count }
              : p
          ) ?? cur
        );
      }
    } catch {/* ignore */}
    finally {
      setPending((s) => { const n = new Set(s); n.delete(post.id); return n; });
    }
  }

  async function deletePost(post: FeedPost) {
    if (!post.is_own) return;
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) setPosts((cur) => cur?.filter((p) => p.id !== post.id) ?? cur);
    } catch {/* ignore */}
  }

  return (
    <div className="min-h-screen bg-ink pt-nav pb-12 pb-safe">
      <div className="max-w-md mx-auto px-3 sm:px-4 pt-8 sm:pt-12">
        {/* Editorial page header */}
        <Reveal>
          <header className="mb-8 sm:mb-10">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-champagne/50" />
              The Edit · Daily Dispatch
            </p>
            <div className="flex items-end justify-between gap-4">
              <h1 className="headline-editorial text-cream text-4xl sm:text-5xl">
                The <span className="italic text-champagne">Feed</span>
              </h1>
              {session?.user?.id ? (
                <button
                  onClick={() => setComposerOpen(true)}
                  className="btn-editorial whitespace-nowrap !px-5 !py-3 text-[10px]"
                >
                  New Post
                </button>
              ) : (
                <Link href="/auth/signin" className="btn-editorial whitespace-nowrap !px-5 !py-3 text-[10px]">
                  Sign in
                </Link>
              )}
            </div>
            <p className="font-display italic text-cream/45 text-sm sm:text-base mt-4 max-w-sm">
              The craziest LARPs from your friends and the city — filed daily.
            </p>
            <div className="rule-champagne mt-6" />
          </header>
        </Reveal>

        {/* Feed */}
        {posts === null ? (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-champagne/12 bg-navy/40 aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState onCompose={() => setComposerOpen(true)} signedIn={!!session?.user?.id} />
        ) : (
          <ul className="space-y-7 sm:space-y-8">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.id} delay={Math.min(i, 4) * 70}>
                <PostCard
                  post={p}
                  onLike={() => toggleLike(p)}
                  onShare={() => setSharingPost(p)}
                  onDelete={() => deletePost(p)}
                  signedIn={!!session?.user?.id}
                  index={i}
                />
              </Reveal>
            ))}
          </ul>
        )}
      </div>

      {composerOpen && (
        <NewPostModal
          isOpen
          onClose={() => setComposerOpen(false)}
          onCreated={fetchFeed}
        />
      )}

      {/* Floating Messages launcher (left side) */}
      <FeedDMLauncher />

      {sharingPost && (
        <SharePostModal
          postId={sharingPost.id}
          postCaption={sharingPost.caption}
          authorName={sharingPost.author.name}
          onClose={() => setSharingPost(null)}
        />
      )}
    </div>
  );

  // ── helpers (inner so they close over context-free state shape) ──
  function EmptyState({ onCompose, signedIn }: { onCompose: () => void; signedIn: boolean }) {
    return (
      <div className="border border-champagne/15 bg-navy/60 p-9 sm:p-12 text-center">
        <p className="eyebrow mb-5">Awaiting the first entry</p>
        <p className="headline-editorial text-cream text-3xl sm:text-4xl mb-4">
          Quiet <span className="italic text-champagne">so far</span>.
        </p>
        <p className="font-sans text-cream/45 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          When your friends post — or anyone with a public profile does — their LARPs are filed here.
        </p>
        {signedIn ? (
          <button onClick={onCompose} className="btn-editorial">Post the first one</button>
        ) : (
          <Link href="/auth/signin" className="btn-editorial">Sign in</Link>
        )}
      </div>
    );
  }
}

/* ── PostCard (matches the bento card recipe: rounded, champagne/15 border, navy bg) ── */

function PostCard({
  post, onLike, onShare, onDelete, signedIn, index,
}: {
  post: FeedPost;
  onLike: () => void;
  onShare: () => void;
  onDelete: () => void;
  signedIn: boolean;
  index: number;
}) {
  const entryNo = String(index + 1).padStart(2, '0');
  return (
    <article className="group border border-champagne/15 bg-navy overflow-hidden transition-colors duration-500 hover:border-champagne/30">
      {/* Author row */}
      <header className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-champagne/12">
        <span className="numeral text-[11px] shrink-0" aria-hidden>{entryNo}</span>
        <Link href={`/u/${post.author.username ?? post.author.id}`} className="flex items-center gap-3 min-w-0 flex-1 group/author">
          <Avatar name={post.author.name} image={post.author.avatar_url} />
          <div className="min-w-0">
            <p className="font-serif text-cream text-sm leading-tight truncate group-hover/author:text-champagne transition-colors">
              {post.author.name ?? 'LARPer'}
            </p>
            <p className="font-sans text-cream/35 text-[10px] tracking-[0.12em] uppercase truncate">
              {post.location_name ? post.location_name : (post.city_slug ? cityLabel(post.city_slug) : timeAgo(post.created_at))}
              {post.location_name && (
                <> · <span className="text-cream/30">{timeAgo(post.created_at)}</span></>
              )}
            </p>
          </div>
        </Link>
        {post.is_friend && (
          <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-champagne/70 px-2.5 py-1 border border-champagne/30 hidden sm:inline">
            Friend
          </span>
        )}
        {post.is_own && (
          <button
            onClick={onDelete}
            aria-label="Delete post"
            className="text-cream/25 hover:text-red-400/80 transition-colors p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </header>

      {/* Media — image or video */}
      <div className="block bg-black">
        {post.media_type === 'video' ? (
          <FeedVideo src={post.image_url} />
        ) : (
          <Link href={`/u/${post.author.username ?? post.author.id}`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt={post.caption ?? 'LARP'}
              className="w-full h-auto max-h-[70vh] object-cover"
              loading="lazy"
            />
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 sm:px-5 pt-3.5 flex items-center gap-5">
        <button
          onClick={onLike}
          disabled={!signedIn}
          aria-label={post.liked ? 'Unlike' : 'Like'}
          className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-champagne' : 'text-cream/55 hover:text-cream'} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans text-sm tabular-nums">{post.like_count}</span>
        </button>

        <button
          onClick={onShare}
          aria-label="Share"
          className="flex items-center gap-1.5 text-cream/55 hover:text-cream transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans text-sm">Share</span>
        </button>
      </div>

      {/* Caption */}
      {(post.caption || post.author.username) && (
        <div className="px-4 sm:px-5 pt-3 pb-4 sm:pb-5">
          <p className="font-sans text-cream/80 text-sm leading-relaxed">
            {post.author.username && (
              <span className="font-semibold text-champagne mr-1.5">@{post.author.username}</span>
            )}
            {post.caption}
          </p>
        </div>
      )}
    </article>
  );
}

function cityLabel(slug: string) {
  if (slug === 'new-york') return 'New York';
  if (slug === 'london') return 'London';
  if (slug === 'miami') return 'Miami';
  return slug;
}

function Avatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover border border-champagne/20 shrink-0"
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

/* ── Instagram-style autoplay video.
 *    - muted by default (browsers require muted for autoplay)
 *    - plays when ≥60% in view, pauses when it scrolls out
 *    - loops
 *    - small tap-to-unmute speaker icon in the bottom-right */
function FeedVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // play() returns a promise that can reject if interrupted
            // — swallowing is fine, the user can manually play
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      },
      { threshold: [0, 0.6] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto max-h-[70vh] object-cover bg-black"
        muted={muted}
        loop
        playsInline
        autoPlay
        preload="metadata"
      />
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm text-white/85 hover:bg-black/75 hover:text-white transition-colors flex items-center justify-center"
      >
        {muted ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 9l-6 6M16 9l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
