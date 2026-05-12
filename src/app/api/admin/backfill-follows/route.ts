import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// POST /api/admin/backfill-follows
// Creates mutual follows for every accepted friendship that doesn't have them yet.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all accepted friendships
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('status', 'accepted');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!friendships?.length) return NextResponse.json({ inserted: 0 });

  // Build all the mutual follow rows
  const rows: { follower_id: string; following_id: string }[] = [];
  for (const f of friendships) {
    rows.push({ follower_id: f.user_id, following_id: f.friend_id });
    rows.push({ follower_id: f.friend_id, following_id: f.user_id });
  }

  // Upsert — safe to re-run, won't create duplicates
  const { error: upsertError, count } = await supabase
    .from('follows')
    .upsert(rows, { onConflict: 'follower_id,following_id', count: 'exact' });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ success: true, friendships: friendships.length, followsUpserted: count });
}
