import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ blocked: false });

  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', session.user.id)
    .eq('blocked_id', params.id)
    .maybeSingle();

  return NextResponse.json({ blocked: !!data });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.id === params.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

  const { error } = await supabase
    .from('user_blocks')
    .upsert({ blocker_id: session.user.id, blocked_id: params.id }, { onConflict: 'blocker_id,blocked_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove friendship + mutual follows
  await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${session.user.id},friend_id.eq.${params.id}),and(user_id.eq.${params.id},friend_id.eq.${session.user.id})`);

  await Promise.all([
    supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', params.id),
    supabase.from('follows').delete().eq('follower_id', params.id).eq('following_id', session.user.id),
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', session.user.id)
    .eq('blocked_id', params.id);

  return NextResponse.json({ success: true });
}
