import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getTier } from '@/lib/tiers';

export async function GET() {
  // Active pin (most recent non-expired)
  const { data: pin } = await supabase
    .from('leaderboard_pins')
    .select('user_id, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Top scores — now driven by challenge XP
  const { data: rows } = await supabase
    .from('leaderboard_scores')
    .select('id, name, username, avatar_url, score, challenges_completed')
    .order('score', { ascending: false })
    .limit(100);

  if (!rows) return NextResponse.json({ entries: [], pin: null });

  type Row = typeof rows[number];

  const toEntry = (row: Row, rank: number, pinned = false, pinExpiresAt?: string) => ({
    rank,
    id: row.id,
    name: row.name,
    username: row.username,
    avatar_url: row.avatar_url,
    score: row.score,
    challenges_completed: row.challenges_completed,
    tier: getTier(row.score),
    pinned,
    ...(pinExpiresAt ? { pin_expires_at: pinExpiresAt } : {}),
  });

  let list = rows.filter(r => r.score > 0).map((r, i) => toEntry(r, i + 1));

  if (pin) {
    const idx = list.findIndex(e => e.id === pin.user_id);

    if (idx >= 0) {
      const pinnedEntry = { ...list[idx], rank: 1, pinned: true, pin_expires_at: pin.expires_at };
      list.splice(idx, 1);
      list = [pinnedEntry, ...list.map((e, i) => ({ ...e, rank: i + 2 }))];
    } else {
      const { data: pinnedRow } = await supabase
        .from('leaderboard_scores')
        .select('id, name, username, avatar_url, score, challenges_completed')
        .eq('id', pin.user_id)
        .single();

      if (pinnedRow) {
        const pinnedEntry = toEntry(pinnedRow, 1, true, pin.expires_at);
        list = [pinnedEntry, ...list.map((e, i) => ({ ...e, rank: i + 2 }))];
      }
    }
  }

  return NextResponse.json({ entries: list.slice(0, 100), pin: pin ?? null });
}
