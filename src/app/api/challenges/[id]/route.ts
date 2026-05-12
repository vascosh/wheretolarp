import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const challengeId = params.id;

  // Fetch the challenge
  const { data: challenge, error: cErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (cErr || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  const periodKey = periodKeyFor(challenge.frequency);
  const body = await req.json();
  const { action, answer } = body as {
    action: 'progress' | 'quiz' | 'claim';
    answer?: string;
  };

  if (action === 'claim') {
    // User is claiming a challenge that was marked claimable by the tracker
    const { data: existing } = await supabaseAdmin
      .from('user_challenge_progress')
      .select('claimable, completed')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('period_key', periodKey)
      .maybeSingle();

    if (!existing?.claimable || existing?.completed) {
      return NextResponse.json({ error: 'Not claimable' }, { status: 400 });
    }

    await supabaseAdmin
      .from('user_challenge_progress')
      .upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          period_key: periodKey,
          progress: challenge.target_count,
          completed: true,
          claimable: false,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,challenge_id,period_key' }
      );

    return NextResponse.json({ success: true, completed: true, points_earned: challenge.points });
  }

  if (action === 'quiz') {
    if (!challenge.quiz_answer) {
      return NextResponse.json(
        { error: 'Not a quiz challenge' },
        { status: 400 }
      );
    }

    // Check if user has already attempted this quiz this period
    const { data: existingAttempt } = await supabaseAdmin
      .from('user_challenge_progress')
      .select('progress, completed')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('period_key', periodKey)
      .maybeSingle();

    const alreadyAttempted = (existingAttempt?.progress ?? 0) >= 1;

    const correct =
      (answer ?? '').trim().toLowerCase() ===
      challenge.quiz_answer.trim().toLowerCase();

    if (!alreadyAttempted) {
      // First attempt — record it regardless of correctness
      const { error: uErr } = await supabaseAdmin
        .from('user_challenge_progress')
        .upsert(
          {
            user_id: userId,
            challenge_id: challengeId,
            period_key: periodKey,
            progress: 1,
            completed: correct,
            completed_at: correct ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,challenge_id,period_key' }
        );

      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 });
      }

      // Cross-track correct answers into weekly "Quiz Run" and monthly "Quiz Master"
      if (correct && challenge.frequency === 'daily') {
        const weekKey = weeklyKey();
        const monthKey = monthlyKey();
        const crossChallenges = [
          { title: 'Quiz Run',    period_key: weekKey  },
          { title: 'Quiz Master', period_key: monthKey },
        ];

        for (const { title, period_key } of crossChallenges) {
          const { data: crossChallenge } = await supabase
            .from('challenges')
            .select('id, target_count, points')
            .eq('title', title)
            .maybeSingle();

          if (!crossChallenge) continue;

          const { data: crossExisting } = await supabaseAdmin
            .from('user_challenge_progress')
            .select('progress, completed')
            .eq('user_id', userId)
            .eq('challenge_id', crossChallenge.id)
            .eq('period_key', period_key)
            .maybeSingle();

          if (crossExisting?.completed) continue;

          const newProgress = (crossExisting?.progress ?? 0) + 1;
          const nowCompleted = newProgress >= crossChallenge.target_count;

          await supabaseAdmin
            .from('user_challenge_progress')
            .upsert(
              {
                user_id: userId,
                challenge_id: crossChallenge.id,
                period_key,
                progress: newProgress,
                completed: nowCompleted,
                completed_at: nowCompleted ? new Date().toISOString() : null,
              },
              { onConflict: 'user_id,challenge_id,period_key' }
            );
        }
      }
    }

    // Always return the result, but only award points on the first attempt
    return NextResponse.json({
      success: true,
      correct,
      completed: correct,
      progress: 1,
      already_attempted: alreadyAttempted,
      points_earned: correct && !alreadyAttempted ? challenge.points : 0,
      ...(!correct ? { correct_answer: challenge.quiz_answer } : {}),
    });
  }

  if (action === 'progress') {
    // Get current progress
    const { data: existing } = await supabaseAdmin
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('period_key', periodKey)
      .maybeSingle();

    const currentProgress = existing?.progress ?? 0;
    const newProgress = currentProgress + 1;
    const completed = newProgress >= challenge.target_count;

    const { error: uErr } = await supabaseAdmin
      .from('user_challenge_progress')
      .upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          period_key: periodKey,
          progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,challenge_id,period_key' }
      );

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      completed,
      progress: newProgress,
      points_earned: completed ? challenge.points : 0,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
