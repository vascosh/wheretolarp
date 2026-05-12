import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Friends = followers = following (friendships are mutual)
  // Derive all social counts from the friendships table — no follows sync needed
  const [
    { count: planCount },
    { count: friendCount },
  ] = await Promise.all([
    supabase.from('larp_plans').select('*', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('friendships').select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${id},friend_id.eq.${id}`).eq('status', 'accepted'),
  ]);

  const count = friendCount ?? 0;

  return NextResponse.json({
    planCount: planCount ?? 0,
    followerCount: count,
    followingCount: count,
    friendCount: count,
  });
}
