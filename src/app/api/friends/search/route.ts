import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET /api/friends/search?q=username
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const userId = session.user.id;

  // Search by name or username (case-insensitive)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar_url, username')
    .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    .neq('id', userId)
    .limit(10);

  if (!users?.length) return NextResponse.json({ results: [] });

  const ids = users.map(u => u.id);

  // Fetch existing friendships with any of these users
  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, status, user_id, friend_id')
    .or(
      ids.map(id =>
        `and(user_id.eq.${userId},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${userId})`
      ).join(',')
    );

  const results = users.map(u => {
    const f = (friendships ?? []).find(
      r => (r.user_id === userId && r.friend_id === u.id) || (r.user_id === u.id && r.friend_id === userId)
    );
    let status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
    if (f) {
      if (f.status === 'accepted') status = 'accepted';
      else if (f.status === 'pending') status = f.user_id === userId ? 'pending_sent' : 'pending_received';
    }
    return { id: u.id, name: u.name, avatar_url: u.avatar_url, username: u.username ?? null, status, friendshipId: f?.id };
  });

  return NextResponse.json({ results });
}
