import { createClient } from '@supabase/supabase-js';

// Use service-role key so tracker can read challenges and write progress
// regardless of RLS policies — security is enforced upstream (session check in API routes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type TrackableAction = 'plan' | 'friend' | 'leaderboard';

// Primary daily challenge + related weekly/monthly challenges to cross-track
const ACTION_MAP: Record<TrackableAction, {
  daily: string;
  weekly?: { title: string };
  monthly?: { title: string };
}> = {
  plan: {
    daily:   'Plan Something',
    weekly:  { title: 'Five-Plan Week' },
    monthly: { title: 'LARP Legend' },
  },
  friend: {
    daily:   'First Move',
    weekly:  { title: 'Social Butterfly' },
    monthly: { title: 'Social Season' },
  },
  leaderboard: {
    daily: 'Scout the Board',
  },
};

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

async function completeChallenge(
  userId: string,
  challengeId: string,
  periodKey: string,
  points: number,
  title: string
) {
  const { error } = await supabase
    .from('user_challenge_progress')
    .upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        period_key: periodKey,
        progress: 1,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,challenge_id,period_key' }
    );

  if (error) return false;

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'challenge_complete',
    title: `+${points} XP earned!`,
    body: `You completed "${title}" — keep it up.`,
    data: { challenge_id: challengeId, points, link: '/challenges' },
    read: false,
  });

  return true;
}

async function incrementChallenge(
  userId: string,
  challengeId: string,
  periodKey: string,
  targetCount: number,
  points: number,
  title: string
) {
  const { data: existing } = await supabase
    .from('user_challenge_progress')
    .select('progress, completed')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('period_key', periodKey)
    .maybeSingle();

  if (existing?.completed) return;

  const newProgress = (existing?.progress ?? 0) + 1;
  const nowCompleted = newProgress >= targetCount;

  const { error } = await supabase
    .from('user_challenge_progress')
    .upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        period_key: periodKey,
        progress: newProgress,
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,challenge_id,period_key' }
    );

  if (error) return;

  if (nowCompleted) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'challenge_complete',
      title: `+${points} XP earned!`,
      body: `You completed "${title}" — keep it up.`,
      data: { challenge_id: challengeId, points, link: '/challenges' },
      read: false,
    });
  }
}

/**
 * Called after a user performs a tracked action.
 * Auto-completes the matching daily challenge and increments weekly/monthly ones.
 * Fire-and-forget — never throws.
 */
export async function trackChallengeAction(
  userId: string,
  action: TrackableAction
): Promise<void> {
  try {
    const map = ACTION_MAP[action];
    const dKey = dailyKey();
    const wKey = weeklyKey();
    const mKey = monthlyKey();

    // ── Daily ──────────────────────────────────────────────────────
    const { data: daily } = await supabase
      .from('challenges')
      .select('id, points, title, target_count')
      .eq('title', map.daily)
      .eq('frequency', 'daily')
      .maybeSingle();

    if (daily) {
      const { data: existingDaily } = await supabase
        .from('user_challenge_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('challenge_id', daily.id)
        .eq('period_key', dKey)
        .maybeSingle();

      if (!existingDaily?.completed) {
        await completeChallenge(userId, daily.id, dKey, daily.points, daily.title);
      }
    }

    // ── Weekly ─────────────────────────────────────────────────────
    if (map.weekly) {
      const { data: weekly } = await supabase
        .from('challenges')
        .select('id, points, title, target_count')
        .eq('title', map.weekly.title)
        .eq('frequency', 'weekly')
        .maybeSingle();

      if (weekly) {
        await incrementChallenge(userId, weekly.id, wKey, weekly.target_count, weekly.points, weekly.title);
      }
    }

    // ── Monthly ────────────────────────────────────────────────────
    if (map.monthly) {
      const { data: monthly } = await supabase
        .from('challenges')
        .select('id, points, title, target_count')
        .eq('title', map.monthly.title)
        .eq('frequency', 'monthly')
        .maybeSingle();

      if (monthly) {
        await incrementChallenge(userId, monthly.id, mKey, monthly.target_count, monthly.points, monthly.title);
      }
    }
  } catch {
    // Never propagate — tracking is best-effort
  }
}

/**
 * Called when a user submits a spot (from any page).
 * Increments "Spot Hunter" (weekly) and "Curator" (monthly).
 * Fire-and-forget — never throws.
 */
export async function trackSpotSubmission(userId: string): Promise<void> {
  try {
    const entries = [
      { title: 'Spot Hunter', frequency: 'weekly',  period_key: weeklyKey()  },
      { title: 'Curator',     frequency: 'monthly', period_key: monthlyKey() },
    ];

    for (const { title, frequency, period_key } of entries) {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('id, points, title, target_count')
        .eq('title', title)
        .eq('frequency', frequency)
        .maybeSingle();

      if (!challenge) continue;
      await incrementChallenge(userId, challenge.id, period_key, challenge.target_count, challenge.points, challenge.title);
    }
  } catch {
    // Never propagate — tracking is best-effort
  }
}
