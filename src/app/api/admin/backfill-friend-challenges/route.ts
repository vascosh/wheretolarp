import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { trackChallengeAction } from '@/lib/challenge-tracker';

// POST /api/admin/backfill-friend-challenges
// Awards the 'friend' challenge to both sides of every accepted friendship.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('status', 'accepted');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!friendships?.length) return NextResponse.json({ awarded: 0 });

  const userIds = new Set<string>();
  for (const f of friendships) {
    userIds.add(f.user_id);
    userIds.add(f.friend_id);
  }

  await Promise.all(Array.from(userIds).map(id => trackChallengeAction(id, 'friend')));

  return NextResponse.json({ success: true, usersAwarded: userIds.size });
}
