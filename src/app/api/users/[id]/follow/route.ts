import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET — check if current user follows this user
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ following: false });

  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', session.user.id)
    .eq('following_id', params.id)
    .maybeSingle();

  return NextResponse.json({ following: !!data });
}

// POST — follow
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.id === params.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  const { error } = await supabase.from('follows').upsert(
    { follower_id: session.user.id, following_id: params.id },
    { onConflict: 'follower_id,following_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — unfollow
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', session.user.id)
    .eq('following_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
