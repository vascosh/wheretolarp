import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET /api/users/[id]/following — same as followers (friendships are mutual)
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
