import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET /api/users/[id]/followers — list friends (= followers) of [id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${params.id},friend_id.eq.${params.id}`)
    .eq('status', 'accepted');

  const ids = (friendships ?? []).map(f => f.user_id === params.id ? f.friend_id : f.user_id);
  if (!ids.length) return NextResponse.json({ users: [] });

  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar_url, username')
    .in('id', ids);

  return NextResponse.json({ users: users ?? [] });
}

// DELETE /api/users/[id]/followers — remove [id] as a friend/follower of the current user
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${params.id},friend_id.eq.${session.user.id}),and(user_id.eq.${session.user.id},friend_id.eq.${params.id})`);

  // Clean up follows rows if they exist
  await Promise.all([
    supabase.from('follows').delete().eq('follower_id', params.id).eq('following_id', session.user.id),
    supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', params.id),
  ]).catch(() => {});

  return NextResponse.json({ success: true });
}
