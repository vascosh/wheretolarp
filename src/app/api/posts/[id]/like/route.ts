import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/[id]/like — toggles a like for the current user.
 * The like_count column is kept in sync by the post_likes trigger,
 * so we just insert/delete and let Postgres do the counting.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const postId = params.id;
  const userId = session.user.id;

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  }

  // Read back the fresh like_count after the trigger runs
  const { data: post } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', postId)
    .single();

  return NextResponse.json({
    liked: !existing,
    like_count: post?.like_count ?? 0,
  });
}
