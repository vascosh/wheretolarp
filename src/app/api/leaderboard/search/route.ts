import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getTier } from '@/lib/tiers';

// GET /api/leaderboard/search?q=... — find a user's rank by name or username
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Search leaderboard_scores by name or username (case-insensitive)
  const { data: matches } = await supabase
    .from('leaderboard_scores')
    .select('id, name, username, avatar_url, score, challenges_completed')
    .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    .gt('score', 0)
    .limit(10);

  if (!matches?.length) return NextResponse.json({ results: [] });

  // For each match, compute their rank = count of users with strictly higher score + 1
  const results = await Promise.all(
    matches.map(async (m) => {
      const { count } = await supabase
        .from('leaderboard_scores')
        .select('*', { count: 'exact', head: true })
        .gt('score', m.score);

      const rank = (count ?? 0) + 1;
      return {
        rank,
        id: m.id,
        name: m.name,
        username: m.username,
        avatar_url: m.avatar_url,
        score: m.score,
        tier: getTier(m.score),
      };
    })
  );

  results.sort((a, b) => a.rank - b.rank);
  return NextResponse.json({ results });
}
