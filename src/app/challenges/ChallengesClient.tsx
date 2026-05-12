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
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
          <div className="h-3 w-48 rounded bg-white/[0.04]" />
        </div>
        <div className="h-6 w-16 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/[0.04]" />
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-3xl p-5 sm:p-8 shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #152844 0%, #0e1e35 100%)',
          border: '1px solid rgba(201,169,110,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cream/30 hover:text-cream/60 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Quiz icon */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)' }}
          >
            <QuizIcon className="text-[#C9A96E]" />
          </div>
          <div>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C9A96E]/60">Daily Quiz</p>
            <p className="font-sans text-xs text-cream/30">{challenge.points} XP · one attempt only</p>
          </div>
        </div>

        {/* Already attempted warning */}
        {previouslyAttempted && (
          <div className="mb-6 px-4 py-3 rounded-xl flex items-start gap-2.5"
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
        <h3 className="font-serif text-xl text-cream/90 mb-8 leading-relaxed">
          {challenge.quiz_question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full text-left px-5 py-4 rounded-2xl font-sans text-sm transition-all duration-300 ${getOptionTextClass(option)} ${
                !selected ? 'hover:bg-white/[0.06] cursor-pointer' : 'cursor-default'
              }`}
              style={getOptionStyle(option)}
            >
              <span className="text-cream/20 mr-3 font-mono text-xs">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Result message */}
        {result && (
          <div className="mt-6 text-center">
            <p
              className={`font-serif text-lg ${
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
  onQuizClick,
  onClaim,
  onSubmitSpot,
}: {
  challenge: Challenge;
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
      className={`rounded-2xl p-5 transition-all duration-300 ${
        isCompleted ? 'opacity-70' : ''
      }`}
      style={{
        background: isCompleted
          ? 'rgba(201,169,110,0.04)'
          : 'rgba(255,255,255,0.03)',
        border: isCompleted
          ? '1px solid rgba(201,169,110,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isCompleted
          ? '0 0 20px rgba(201,169,110,0.05)'
          : 'none',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: isCompleted
              ? 'rgba(201,169,110,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: isCompleted
              ? '1px solid rgba(201,169,110,0.2)'
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {isCompleted ? (
            <CheckIcon className="text-[#C9A96E]" />
          ) : (
            <CategoryIcon
              category={challenge.category}
              className="text-cream/40"
            />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-sm text-cream/90 truncate">
              {challenge.title}
            </h3>
            {isCompleted && (
              <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#C9A96E]/60 shrink-0">
                Completed
              </span>
            )}
          </div>
          <p className="font-sans text-xs text-cream/35 mt-0.5 line-clamp-1">
            {challenge.description}
          </p>
          {!isQuiz && challenge.target_count > 1 && (
            <p className="font-sans text-xs text-cream/50 mt-1 tabular-nums">
              {challenge.user_progress} / {challenge.target_count}
            </p>
          )}
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: isCompleted
                ? 'rgba(201,169,110,0.12)'
                : 'rgba(201,169,110,0.08)',
              color: isCompleted ? '#C9A96E' : 'rgba(201,169,110,0.7)',
              border: isCompleted
                ? '1px solid rgba(201,169,110,0.25)'
                : '1px solid rgba(201,169,110,0.1)',
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
              className="w-full py-2.5 rounded-xl font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 hover:-translate-y-px animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,110,0.25), rgba(201,169,110,0.12))',
                border: '1px solid rgba(201,169,110,0.45)',
                color: '#C9A96E',
                boxShadow: '0 0 16px rgba(201,169,110,0.15)',
              }}
            >
              ✦ Claim {challenge.points} XP
            </button>
          ) : isQuiz ? (
            <>
              {challenge.quiz_question && (
                <p className="font-serif text-sm text-cream/70 leading-relaxed mb-3 italic">
                  &ldquo;{challenge.quiz_question}&rdquo;
                </p>
              )}
              <button
                onClick={() => onQuizClick(challenge)}
                className="w-full py-2.5 rounded-xl font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.08))',
                  border: '1px solid rgba(201,169,110,0.2)',
                  color: '#C9A96E',
                }}
              >
                Answer
              </button>
            </>
          ) : (
            <>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #C9A96E, #b8944d)' }} />
              </div>
              {/* Redirect button(s) */}
              {(challenge.title === 'Plan Something' || challenge.title === 'Five-Plan Week' || challenge.title === 'LARP Legend') ? (
                <div className="flex gap-2">
                  {PLAN_SOMETHING_CITIES.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex-1 py-2.5 text-center rounded-xl font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 hover:-translate-y-px"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(245,240,232,0.45)',
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : (challenge.title === 'Spot Hunter' || challenge.title === 'Curator') ? (
                <button
                  onClick={() => onSubmitSpot(challenge)}
                  className="block w-full py-2.5 text-center rounded-xl font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 hover:-translate-y-px"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(245,240,232,0.45)',
                  }}
                >
                  Submit a Spot →
                </button>
              ) : CHALLENGE_REDIRECTS[challenge.title] ? (
                <Link
                  href={CHALLENGE_REDIRECTS[challenge.title].href}
                  className="block w-full py-2.5 text-center rounded-xl font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200 hover:-translate-y-px"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(245,240,232,0.45)',
                  }}
                >
                  {CHALLENGE_REDIRECTS[challenge.title].label}
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
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, rgba(201,169,110,0.4), rgba(201,169,110,0.2))',
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(160deg, #0e1e35 0%, #152844 60%, #0b1a2e 100%)',
        }}
      >
        <div className="text-center px-6">
          <h1 className="font-serif text-2xl text-cream/90 mb-3">
            Sign in to access Challenges
          </h1>
          <p className="font-sans text-sm text-cream/40 mb-6">
            Complete daily, weekly, and monthly challenges to earn XP and climb the ranks.
          </p>
          <Link
            href="/"
            className="inline-block font-sans text-xs tracking-[0.15em] uppercase px-6 py-3 rounded-full transition-all"
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #b8944d)',
              color: '#0a1628',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        background: 'linear-gradient(160deg, #0e1e35 0%, #152844 60%, #0b1a2e 100%)',
      }}
    >
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
      <div className="pb-8 px-4 sm:px-6" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto text-center">
          {/* Season label */}
          <p
            className="font-sans text-[10px] tracking-[0.3em] uppercase mb-2"
            style={{ color: 'rgba(201,169,110,0.5)' }}
          >
            Season 1
          </p>

          {/* Month heading */}
          {loading ? (
            <div className="h-10 w-48 mx-auto rounded bg-white/[0.04] animate-pulse mb-4" />
          ) : (
            <h1
              className="font-serif text-4xl sm:text-5xl font-bold mb-3"
              style={{
                color: '#C9A96E',
                textShadow: '0 0 40px rgba(201,169,110,0.3), 0 0 80px rgba(201,169,110,0.1)',
              }}
            >
              {data?.monthLabel ?? 'Challenges'}
            </h1>
          )}

          {/* Countdown */}
          {!loading && data && (
            <p className="font-sans text-xs text-cream/30 mb-6">
              Resets in{' '}
              <span className="text-cream/50 font-medium tabular-nums">
                {data.daysRemaining}
              </span>{' '}
              {data.daysRemaining === 1 ? 'day' : 'days'}
            </p>
          )}

          {/* Season XP */}
          {!loading && data && (
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/30">
                  {currentTier.name}
                </span>
                <span className="font-sans text-sm font-semibold tabular-nums" style={{ color: '#C9A96E' }}>
                  {data.seasonXP} XP
                </span>
                {nextTier && (
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/30">
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
      <div className="px-4 sm:px-6 mb-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex w-full rounded-2xl p-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {(['daily', 'weekly', 'monthly'] as Tab[]).map((t) => {
              const isActive = tab === t;
              const count = data?.challenges.filter((c) => c.frequency === t).length ?? 0;
              const completedCount = data?.challenges.filter(
                (c) => c.frequency === t && c.user_completed
              ).length ?? 0;

              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-xl font-sans text-xs tracking-[0.1em] uppercase transition-all duration-200 relative ${
                    isActive
                      ? 'font-semibold'
                      : 'text-cream/30 hover:text-cream/50'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'rgba(201,169,110,0.1)',
                          color: '#C9A96E',
                          border: '1px solid rgba(201,169,110,0.15)',
                        }
                      : { border: '1px solid transparent' }
                  }
                >
                  {t}
                  {count > 0 && (
                    <span
                      className="ml-1.5 font-mono text-[9px]"
                      style={{ color: isActive ? 'rgba(201,169,110,0.5)' : 'rgba(245,240,232,0.15)' }}
                    >
                      {completedCount}/{count}
                    </span>
                  )}
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
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-cream/15">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-serif text-sm text-cream/30">
                No challenges available
              </p>
            </div>
          ) : (
            filtered.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
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
        <div className="px-4 sm:px-6 mt-10">
          <div className="max-w-2xl mx-auto">
            <div
              className="rounded-2xl p-5 flex items-center justify-around"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              {(['daily', 'weekly', 'monthly'] as const).map((freq) => {
                const freqChallenges = data.challenges.filter((c) => c.frequency === freq);
                const earned = freqChallenges
                  .filter((c) => c.user_completed)
                  .reduce((sum, c) => sum + c.points, 0);
                const total = freqChallenges.reduce((sum, c) => sum + c.points, 0);
                return (
                  <div key={freq} className="text-center">
                    <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-cream/20 mb-1">
                      {freq}
                    </p>
                    <p className="font-sans text-sm font-semibold tabular-nums" style={{ color: '#C9A96E' }}>
                      {earned}
                      <span className="text-cream/15 font-normal">/{total}</span>
                    </p>
                    <p className="font-sans text-[9px] text-cream/15 mt-0.5">XP</p>
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
