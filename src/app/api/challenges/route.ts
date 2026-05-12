import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';

function dailyKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weeklyKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function monthlyKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function periodKeyFor(frequency: string): string {
  switch (frequency) {
    case 'daily':
      return dailyKey();
    case 'weekly':
      return weeklyKey();
    case 'monthly':
      return monthlyKey();
    default:
      return dailyKey();
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch all active challenges
  const { data: challenges, error: cErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (cErr || !challenges) {
    return NextResponse.json(
      { error: cErr?.message ?? 'Failed to load challenges' },
      { status: 500 }
    );
  }

  // Compute period keys
  const dKey = dailyKey();
  const wKey = weeklyKey();
  const mKey = monthlyKey();

  // Fetch user progress for all three current periods (service-role bypasses RLS)
  const { data: progress } = await supabaseAdmin
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('period_key', [dKey, wKey, mKey]);

  // Build lookup: challenge_id+period_key -> progress row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const progressMap = new Map<string, any>();
  if (progress) {
    for (const p of progress) {
      progressMap.set(`${(p as any).challenge_id}:${(p as any).period_key}`, p);
    }
  }

  // For daily quiz challenges, pick one per day.
  // 7 unique questions per week (one per day-of-week), set rotates each week.
  const dailyQuizzes = challenges.filter(
    (c) => c.frequency === 'daily' && c.category === 'quiz'
  );
  // Sort by sort_order so the pool is deterministic
  dailyQuizzes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const nonQuizDaily = challenges.filter(
    (c) => !(c.frequency === 'daily' && c.category === 'quiz')
  );

  let selectedQuiz = null;
  if (dailyQuizzes.length > 0) {
    // If the user already answered (or has progress on) a quiz today, always show that one
    const answeredToday = dailyQuizzes.find(q =>
      progressMap.has(`${q.id}:${dKey}`)
    );

    if (answeredToday) {
      selectedQuiz = answeredToday;
    } else {
      const now = new Date();
      // ISO week number
      const jan4 = new Date(now.getFullYear(), 0, 4);
      const weekNum = Math.ceil(
        ((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
      );
      // Day of week: 0 (Sun) – 6 (Sat)
      const dayOfWeek = now.getDay();
      // Each week starts at a different offset; 7 and pool size are coprime so no intra-week repeats
      const idx = (weekNum * 7 + dayOfWeek) % dailyQuizzes.length;
      selectedQuiz = dailyQuizzes[idx];
    }
  }

  // Merge challenges with user progress
  const result = [];
  const allToReturn = selectedQuiz
    ? [selectedQuiz, ...nonQuizDaily]
    : [...nonQuizDaily];

  for (const c of allToReturn) {
    const pk = periodKeyFor(c.frequency);
    const prog = progressMap.get(`${c.id}:${pk}`);
    result.push({
      ...c,
      user_progress: prog?.progress ?? 0,
      user_completed: prog?.completed ?? false,
      user_claimable: prog?.claimable ?? false,
      user_completed_at: prog?.completed_at ?? null,
      period_key: pk,
    });
  }

  // Sort: incomplete first, then completed
  result.sort((a, b) => {
    if (a.user_completed !== b.user_completed)
      return a.user_completed ? 1 : -1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // Compute season XP: sum of points for all completed challenges in current month
  const { data: monthProgress } = await supabaseAdmin
    .from('user_challenge_progress')
    .select('challenge_id, completed')
    .eq('user_id', userId)
    .eq('completed', true)
    .like('period_key', `${mKey}%`);

  // Also get daily/weekly completions within this month
  const { data: allMonthProgress } = await supabaseAdmin
    .from('user_challenge_progress')
    .select('challenge_id, completed, period_key')
    .eq('user_id', userId)
    .eq('completed', true);

  let seasonXP = 0;
  if (allMonthProgress && challenges) {
    const challengePoints = new Map<string, number>();
    for (const c of challenges) {
      challengePoints.set(c.id, c.points);
    }

    const currentMonth = mKey; // e.g. "2026-05"
    for (const p of allMonthProgress) {
      const pk = p.period_key;
      // Check if this period_key falls within current month
      if (
        pk === currentMonth || // monthly
        pk.startsWith(currentMonth) // daily (2026-05-01) or weekly in month
      ) {
        seasonXP += challengePoints.get(p.challenge_id) ?? 0;
      } else if (pk.includes('-W')) {
        // Weekly keys like "2026-W18" - check if week is in current month
        // Approximate: include if year matches
        const yearStr = pk.split('-W')[0];
        if (yearStr === currentMonth.split('-')[0]) {
          // Check if this week overlaps with current month
          const weekNum = parseInt(pk.split('-W')[1]);
          const monthNum = parseInt(currentMonth.split('-')[1]);
          // Rough: week 1-4 -> month 1, week 5-8 -> month 2, etc.
          const approxMonth = Math.ceil(weekNum / 4.33);
          if (Math.abs(approxMonth - monthNum) <= 1) {
            seasonXP += challengePoints.get(p.challenge_id) ?? 0;
          }
        }
      }
    }
  }

  // Days remaining in month
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = endOfMonth.getDate() - now.getDate();

  return NextResponse.json({
    challenges: result,
    seasonXP,
    daysRemaining,
    monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  });
}
