import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = session.user.id;

  // Delete all user data in dependency order
  await Promise.all([
    supabase.from('notifications').delete().eq('user_id', id),
    supabase.from('larp_plans').delete().eq('user_id', id),
    supabase.from('user_challenge_progress').delete().eq('user_id', id),
    supabase.from('leaderboard_scores').delete().eq('user_id', id),
    supabase.from('leaderboard_pins').delete().eq('user_id', id),
    supabase.from('user_blocks').delete().or(`blocker_id.eq.${id},blocked_id.eq.${id}`),
    supabase.from('user_reports').delete().eq('reporter_id', id),
    supabase.from('follows').delete().or(`follower_id.eq.${id},following_id.eq.${id}`),
    supabase.from('friendships').delete().or(`user_id.eq.${id},friend_id.eq.${id}`),
    supabase.from('plan_invites').delete().or(`inviter_id.eq.${id},invitee_id.eq.${id}`),
    supabase.from('submitted_spots').delete().eq('submitted_by', id),
  ]);

  // Delete messages and conversations
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_1.eq.${id},participant_2.eq.${id}`);

  if (convs?.length) {
    const convIds = convs.map(c => c.id);
    await supabase.from('message_reads').delete().in('message_id',
      (await supabase.from('messages').select('id').in('conversation_id', convIds)).data?.map(m => m.id) ?? []
    );
    await supabase.from('messages').delete().in('conversation_id', convIds);
    await supabase.from('conversations').delete().or(`participant_1.eq.${id},participant_2.eq.${id}`);
  }

  // Finally delete the user record
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
