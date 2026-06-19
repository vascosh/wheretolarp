'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SubmitSpotModal from '@/components/SubmitSpotModal';

// ── Types ──────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: 'social' | 'quiz' | 'activity';
  points: number;
  target_count: number;
  quiz_question?: string;
  quiz_options?: string[];
  quiz_answer?: string;
  sort_order: number;
  user_progress: number;
  user_completed: boolean;
  user_claimable: boolean;
  user_completed_at: string | null;
  period_key: string;
}

interface ChallengesData {
  challenges: Challenge[];
  seasonXP: number;
  daysRemaining: number;
  monthLabel: string;
}

type Tab = 'daily' | 'weekly' | 'monthly';

// ── Season tier thresholds ─────────────────────────────────────────
const SEASON_TIERS = [
  { name: 'Bronze',   threshold: 0    },
  { name: 'Silver',   threshold: 300  },
  { name: 'Gold',     threshold: 600  },
  { name: 'Platinum', threshold: 900  },
  { name: 'Diamond',  threshold: 1500 },
];

function getCurrentTier(xp: number) {
  let tier = SEASON_TIERS[0];
  for (const t of SEASON_TIERS) {
    if (xp >= t.threshold) tier = t;
  }
  return tier;
}

function getNextTier(xp: number) {
  for (const t of SEASON_TIERS) {
    if (xp < t.threshold) return t;
  }
  return null;
}

// ── SVG Icons ──────────────────────────────────────────────────────
function QuizIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9.5C9 8.12 10.12 7 11.5 7H12.5C13.88 7 15 8.12 15 9.5C15 10.88 13.88 12 12.5 12H12V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function SocialIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 12c2.5 0 4.5 1.8 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5L9 13.5L14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z" />
    </svg>
  );
}

// ── Category icon helper ───────────────────────────────────────────
function CategoryIcon({ category, className }: { category: string; className?: string }) {
  switch (category) {
    case 'quiz':
      return <QuizIcon className={className} />;
    case 'social':
      return <SocialIcon className={className} />;
    case 'activity':
      return <ActivityIcon className={className} />;
    default:
      return <ActivityIcon className={className} />;
  }
}

// ── Skeleton Card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-5 sm:p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,110,0.12)' }}>
      <div className="flex items-start gap-4">
        <div className="w-7 sm:w-9 h-6 bg-white/[0.05]" />
        <div className="w-10 h-10 bg-white/[0.06]" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 bg-white/[0.06]" />
          <div className="h-3 w-48 bg-white/[0.04]" />
        </div>
        <div className="h-6 w-14 bg-white/[0.06]" />
      </div>
      <div className="mt-4 h-1 bg-white/[0.04]" />
    </div>
  );
}

// ── Confetti Effect (CSS only) ─────────────────────────────────────
function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.5 + Math.random() * 1;
        const size = 6 + Math.random() * 6;
        const colors = ['#C9A96E', '#F5F0E8', '#b8944d', '#E8D5A3', '#8B6914'];
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: '-10px',
              width: size,
              height: size * 0.6,
              backgroundColor: color,
              borderRadius: '2px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg) scale(0.3);
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}

// ── Points Animation ───────────────────────────────────────────────
function PointsPopup({ points }: { points: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99] flex items-center justify-center">
      <div className="animate-points-rise font-serif text-4xl font-bold" style={{ color: '#C9A96E', textShadow: '0 0 30px rgba(201,169,110,0.6)' }}>
        +{points} XP
      </div>
      <style jsx>{`
        @keyframes points-rise {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1);
          }
        }
        .animate-points-rise {
          animation: points-rise 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ── Quiz Modal ─────────────────────────────────────────────────────
function QuizModal({
  challenge,
  onClose,
  onComplete,
}: {
  challenge: Challenge;
  onClose: () => void;
  onComplete: (correct: boolean, points: number) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctAnswer?: string; alreadyAttempted?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If they've already attempted this period (progress >= 1 but not completed = wrong answer)
  const previouslyAttempted = challenge.user_progress >= 1 && !challenge.user_completed;

  const options: string[] = challenge.quiz_options ?? [];

  async function handleSelect(option: string) {
    if (selected || submitting) return;
    setSelected(option);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quiz', answer: option }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Quiz API error:', data);
        setSubmitting(false);
        setSelected(null);
        return;
      }
      setResult({
        correct: data.correct,
        correctAnswer: data.correct ? undefined : data.correct_answer,
        alreadyAttempted: data.already_attempted,
      });

      setTimeout(() => {
        onComplete(data.correct, data.points_earned ?? 0);
      }, 700);
    } catch {
      setSubmitting(false);
      setSelected(null);
    }
  }

  function getOptionStyle(option: string) {
    if (!selected) {
      return {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      };
    }
    if (result) {
      if (option === selected && result.correct) {
        return {
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.5)',
        };
      }
      if (option === selected && !result.correct) {
        return {
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.5)',
        };
      }
      if (result.correctAnswer && option === result.correctAnswer) {
        return {
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
        };
      }
    }
    return {
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    };
  }

  function getOptionTextClass(option: string) {
    if (!result) return 'text-cream/80';
    if (option === selected && result.correct) return 'text-green-400';
    if (option === selected && !result.correct) return 'text-red-400';
    if (result.correctAnswer && option === result.correctAnswer) return 'text-green-400';
    return 'text-cream/30';
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg p-5 sm:p-8 shadow-2xl overflow-hidden"
        style={{
          background: '#060D18',
          border: '1px solid rgba(201,169,110,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)' }} />
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close quiz"
          className="absolute top-4 right-4 text-cream/30 hover:text-champagne transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Quiz icon */}
        <div className="flex items-center gap-3 mb-7">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.18)' }}
          >
            <QuizIcon className="text-[#C9A96E]" />
          </div>
          <div>
            <p className="eyebrow text-[10px] text-[#C9A96E]/70">Daily Quiz</p>
            <p className="font-sans text-xs text-cream/35 mt-0.5">{challenge.points} XP · one attempt only</p>
          </div>
        </div>

        {/* Already attempted warning */}
        {previouslyAttempted && (
          <div className="mb-6 px-4 py-3 flex items-start gap-2.5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-400/70 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="font-sans text-xs text-red-300/70 leading-relaxed">
              You&apos;ve already used your one attempt today. You can still answer, but no XP will be awarded.
            </p>
          </div>
        )}

        {/* Question */}
        <h3 className="headline-editorial text-cream text-2xl sm:text-3xl mb-8 leading-snug">
          {challenge.quiz_question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full text-left px-5 py-4 font-sans text-sm transition-all duration-300 ${getOptionTextClass(option)} ${
                !selected ? 'hover:bg-white/[0.06] cursor-pointer' : 'cursor-default'
              }`}
              style={getOptionStyle(option)}
            >
              <span className="numeral text-champagne/40 mr-3 text-xs">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Result message */}
        {result && (
          <div className="mt-7 text-center">
            <p
              className={`font-display italic text-xl ${
                result.correct ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {result.correct ? 'Correct!' : 'Not quite!'}
            </p>
            {!result.correct && result.correctAnswer && (
              <p className="font-sans text-sm text-cream/40 mt-1">
                The answer was: <span className="text-cream/60">{result.correctAnswer}</span>
              </p>
            )}
            {result.alreadyAttempted && (
              <p className="font-sans text-xs text-cream/25 mt-2">No XP awarded — one attempt per day.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Challenge Card ─────────────────────────────────────────────────
const CHALLENGE_REDIRECTS: Record<string, { label: string; href: string }> = {
  'First Move':            { label: 'Add a Friend →',      href: '/profile' },
  'Scout the Board':       { label: 'Go to Leaderboard →', href: '/leaderboard' },
  'Social Butterfly':      { label: 'Add Friends →',        href: '/profile' },
  'Five-Plan Week':        { label: 'Browse Spots →',       href: '/city/new-york' },
  'Neighborhood Explorer': { label: 'Browse Cities →',      href: '/' },
  'Social Season':         { label: 'Add Friends →',        href: '/profile' },
  'Rising Star':           { label: 'View Leaderboard →',   href: '/leaderboard' },
};

const PLAN_SOMETHING_CITIES = [
  { label: 'New York', href: '/city/new-york' },
  { label: 'London',   href: '/city/london' },
  { label: 'Miami',    href: '/city/miami' },
];

function ChallengeCard({
  challenge,
  index,
  onQuizClick,
  onClaim,
  onSubmitSpot,
}: {
  challenge: Challenge;
  index: number;
  onQuizClick: (c: Challenge) => void;
  onClaim: (c: Challenge) => void;
  onSubmitSpot: (c: Challenge) => void;
}) {
  const isQuiz = challenge.category === 'quiz' && !!challenge.quiz_question;
  const isCompleted = challenge.user_completed;
  const isClaimable = challenge.user_claimable && !isCompleted;
  const progressPct =
    challenge.target_count > 0
      ? Math.min(100, (challenge.user_progress / challenge.target_count) * 100)
      : 0;

  return (
    <div
      className={`p-5 sm:p-6 transition-all duration-300 ${
        isCompleted ? 'opacity-75' : ''
      }`}
      style={{
        background: isCompleted
          ? 'rgba(201,169,110,0.04)'
          : 'rgba(255,255,255,0.02)',
        border: isCompleted
          ? '1px solid rgba(201,169,110,0.22)'
          : '1px solid rgba(201,169,110,0.12)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Catalogue numeral */}
        <span className="numeral text-xl sm:text-2xl leading-none shrink-0 w-7 sm:w-9 text-right mt-1 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Category icon */}
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: isCompleted
              ? 'rgba(201,169,110,0.12)'
              : 'rgba(255,255,255,0.03)',
            border: isCompleted
              ? '1px solid rgba(201,169,110,0.2)'
              : '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {isCompleted ? (
            <CheckIcon className="text-[#C9A96E]" />
          ) : (
            <CategoryIcon
              category={challenge.category}
              className="text-champagne/50"
            />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="headline-editorial text-cream text-lg sm:text-xl truncate">
              {challenge.title}
            </h3>
            {isCompleted && (
              <span className="eyebrow text-[9px] text-[#C9A96E]/60 shrink-0">
                Completed
              </span>
            )}
          </div>
          <p className="font-sans text-xs sm:text-sm text-cream/40 mt-1 line-clamp-1">
            {challenge.description}
          </p>
          {!isQuiz && challenge.target_count > 1 && (
            <p className="numeral text-xs mt-1.5 tabular-nums">
              {challenge.user_progress} / {challenge.target_count}
            </p>
          )}
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 font-display text-sm px-3 py-1"
            style={{
              background: isCompleted
                ? 'rgba(201,169,110,0.12)'
                : 'rgba(201,169,110,0.08)',
              color: isCompleted ? '#C9A96E' : 'rgba(201,169,110,0.8)',
              border: isCompleted
                ? '1px solid rgba(201,169,110,0.25)'
                : '1px solid rgba(201,169,110,0.15)',
            }}
          >
            <StarIcon className="w-3 h-3" />
            {challenge.points}
          </span>
        </div>
      </div>

      {/* Bottom section */}
      {!isCompleted && (
        <div className="mt-4">
          {isClaimable ? (
            /* Claimable — user performed the action, just needs to claim */
            <button
              onClick={() => onClaim(challenge)}
              className="btn-editorial w-full animate-pulse"
            >
              <span aria-hidden>✦</span> Claim {challenge.points} XP
            </button>
          ) : isQuiz ? (
            <>
              {challenge.quiz_question && (
                <p className="font-display italic text-sm sm:text-base text-cream/65 leading-relaxed mb-4">
                  &ldquo;{challenge.quiz_question}&rdquo;
                </p>
              )}
              <button
                onClick={() => onQuizClick(challenge)}
                className="btn-editorial-ghost w-full"
              >
                Answer
              </button>
            </>
          ) : (
            <>
              {/* Progress bar */}
              <div className="h-1 overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #C9A96E, #b8944d)' }} />
              </div>
              {/* Redirect button(s) */}
              {(challenge.title === 'Plan Something' || challenge.title === 'Five-Plan Week' || challenge.title === 'LARP Legend') ? (
                <div className="flex gap-2">
                  {PLAN_SOMETHING_CITIES.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex-1 py-3 text-center font-sans text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-cream/45 border border-champagne/15 hover:border-champagne/40 hover:text-champagne transition-all duration-300"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : (challenge.title === 'Spot Hunter' || challenge.title === 'Curator') ? (
                <button
                  onClick={() => onSubmitSpot(challenge)}
                  className="link-underline"
                >
                  Submit a Spot <span aria-hidden>→</span>
                </button>
              ) : CHALLENGE_REDIRECTS[challenge.title] ? (
                <Link
                  href={CHALLENGE_REDIRECTS[challenge.title].href}
                  className="link-underline"
                >
                  {CHALLENGE_REDIRECTS[challenge.title].label.replace(/\s*→\s*$/, '')} <span aria-hidden>→</span>
                </Link>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Completed progress bar (full) */}
      {isCompleted && (
        <div className="mt-4">
          <div
            className="h-1 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div
              className="h-full"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, rgba(201,169,110,0.5), rgba(201,169,110,0.25))',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ChallengesClient() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>('daily');
  const [data, setData] = useState<ChallengesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizChallenge, setQuizChallenge] = useState<Challenge | null>(null);
  const [submitSpotChallenge, setSubmitSpotChallenge] = useState<Challenge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsPopup, setPointsPopup] = useState<number | null>(null);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChallenges();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, fetchChallenges]);

  function triggerReward(points: number) {
    setShowConfetti(true);
    setPointsPopup(points);
    setTimeout(() => setShowConfetti(false), 2500);
    setTimeout(() => setPointsPopup(null), 2000);
  }

  async function handleClaim(challenge: Challenge) {
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' }),
      });
      const result = await res.json();
      if (result.completed) {
        triggerReward(challenge.points);
      }
      fetchChallenges();
    } catch {
      // ignore
    }
  }

  function handleQuizComplete(correct: boolean, points: number) {
    setQuizChallenge(null);
    if (correct) {
      triggerReward(points);
    }
    fetchChallenges();
  }

  async function handleSpotSubmitted() {
    if (!submitSpotChallenge) return;
    const challenge = submitSpotChallenge;
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress' }),
      });
      const result = await res.json();
      if (result.completed) triggerReward(challenge.points);
    } catch {}
    fetchChallenges();
  }

  const filtered = data?.challenges.filter((c) => c.frequency === tab) ?? [];

  const currentTier = getCurrentTier(data?.seasonXP ?? 0);
  const nextTier = getNextTier(data?.seasonXP ?? 0);
  const tierProgress = nextTier
    ? ((data?.seasonXP ?? 0) - currentTier.threshold) /
      (nextTier.threshold - currentTier.threshold)
    : 1;

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-cream px-6">
        <div className="text-center max-w-md">
          <p className="eyebrow mb-6 flex items-center justify-center gap-4">
            <span className="inline-block h-px w-10 bg-champagne/50" />
            Members Only
            <span className="inline-block h-px w-10 bg-champagne/50" />
          </p>
          <h1 className="headline-editorial text-cream text-4xl sm:text-5xl mb-5">
            The <span className="italic text-champagne">Catalogue</span> awaits.
          </h1>
          <p className="font-sans text-sm text-cream/45 leading-relaxed mb-8">
            Sign in to complete daily, weekly, and monthly quests — earn XP and
            climb the ranked register.
          </p>
          <Link href="/" className="btn-editorial">
            Go Home <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-ink text-cream">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(201,169,110,0.07) 0%, transparent 60%)' }} />
      {/* Confetti & points animations */}
      {showConfetti && <Confetti />}
      {pointsPopup !== null && <PointsPopup points={pointsPopup} />}

      {/* Quiz modal */}
      {quizChallenge && (
        <QuizModal
          challenge={quizChallenge}
          onClose={() => setQuizChallenge(null)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* ── Season Header ───────────────────────────────────────── */}
      <div className="relative pb-10 px-4 sm:px-6" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto text-center">
          {/* Season label */}
          <p className="eyebrow mb-5 flex items-center justify-center gap-4">
            <span className="inline-block h-px w-10 bg-champagne/50" />
            The Catalogue · Season 1
            <span className="inline-block h-px w-10 bg-champagne/50" />
          </p>

          {/* Month heading */}
          {loading ? (
            <div className="h-12 w-56 mx-auto rounded bg-white/[0.04] animate-pulse mb-4" />
          ) : (
            <h1 className="headline-editorial text-champagne text-5xl sm:text-7xl mb-4">
              {data?.monthLabel ?? 'Challenges'}
            </h1>
          )}

          {/* Countdown */}
          {!loading && data && (
            <p className="font-display italic text-cream/40 text-base sm:text-lg mb-7">
              Resets in{' '}
              <span className="text-champagne not-italic tabular-nums">
                {data.daysRemaining}
              </span>{' '}
              {data.daysRemaining === 1 ? 'day' : 'days'}
            </p>
          )}

          {/* Season XP */}
          {!loading && data && (
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-[10px] text-cream/35">
                  {currentTier.name}
                </span>
                <span className="font-display text-base tabular-nums" style={{ color: '#C9A96E' }}>
                  {data.seasonXP} XP
                </span>
                {nextTier && (
                  <span className="eyebrow text-[10px] text-cream/35">
                    {nextTier.name}
                  </span>
                )}
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, tierProgress * 100)}%`,
                    background: 'linear-gradient(90deg, #8B6914, #C9A96E, #E8D5A3)',
                    boxShadow: '0 0 10px rgba(201,169,110,0.3)',
                  }}
                />
              </div>
              {nextTier && (
                <p className="font-sans text-[10px] text-cream/20 mt-1.5 text-center">
                  {nextTier.threshold - data.seasonXP} XP to {nextTier.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex w-full border-y border-champagne/15">
            {(['daily', 'weekly', 'monthly'] as Tab[]).map((t, i) => {
              const isActive = tab === t;
              const count = data?.challenges.filter((c) => c.frequency === t).length ?? 0;
              const completedCount = data?.challenges.filter(
                (c) => c.frequency === t && c.user_completed
              ).length ?? 0;

              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-pressed={isActive}
                  className={`relative flex-1 py-4 font-sans text-[11px] tracking-[0.25em] uppercase transition-colors duration-300 ${
                    i > 0 ? 'border-l border-champagne/15' : ''
                  } ${
                    isActive ? 'text-champagne' : 'text-cream/35 hover:text-cream/60'
                  }`}
                >
                  {t}
                  {count > 0 && (
                    <span
                      className="ml-2 numeral text-[9px] tabular-nums"
                      style={{ color: isActive ? 'rgba(201,169,110,0.6)' : 'rgba(245,240,232,0.2)' }}
                    >
                      {completedCount}/{count}
                    </span>
                  )}
                  <span className={`absolute left-0 -bottom-px h-px w-full bg-champagne origin-center transition-transform duration-500 ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Challenge Cards ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-y border-champagne/15">
              <p className="font-display italic text-cream/30 text-2xl mb-2">
                The catalogue is empty
              </p>
              <p className="font-sans text-cream/30 text-xs tracking-wide">
                No challenges available for this period.
              </p>
            </div>
          ) : (
            filtered.map((challenge, i) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                index={i}
                onQuizClick={setQuizChallenge}
                onClaim={handleClaim}
                onSubmitSpot={setSubmitSpotChallenge}
              />
            ))
          )}
        </div>
      </div>

      {/* ── XP Summary Footer ───────────────────────────────────── */}
      {!loading && data && (
        <div className="px-4 sm:px-6 mt-12">
          <div className="max-w-2xl mx-auto">
            <p className="eyebrow-muted mb-4 text-champagne/35">The Tally</p>
            <div className="rule-champagne-dim mb-6" />
            <div className="flex items-center justify-around">
              {(['daily', 'weekly', 'monthly'] as const).map((freq) => {
                const freqChallenges = data.challenges.filter((c) => c.frequency === freq);
                const earned = freqChallenges
                  .filter((c) => c.user_completed)
                  .reduce((sum, c) => sum + c.points, 0);
                const total = freqChallenges.reduce((sum, c) => sum + c.points, 0);
                return (
                  <div key={freq} className="text-center">
                    <p className="eyebrow text-[9px] text-cream/30 mb-2">
                      {freq}
                    </p>
                    <p className="font-display text-2xl sm:text-3xl tabular-nums leading-none" style={{ color: '#C9A96E' }}>
                      {earned}
                      <span className="text-cream/20">/{total}</span>
                    </p>
                    <p className="eyebrow text-[9px] text-cream/20 mt-2">XP</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SubmitSpotModal
        isOpen={!!submitSpotChallenge}
        onClose={() => setSubmitSpotChallenge(null)}
        onSuccess={handleSpotSubmitted}
      />
    </div>
  );
}
