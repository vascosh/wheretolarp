import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { trackChallengeAction } from '@/lib/challenge-tracker';

// POST /api/friends/by-id — send friend request by user ID
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });
  if (targetId === session.user.id) return NextResponse.json({ error: "You can't add yourself." }, { status: 400 });

  const { data: target } = await supabase
    .from('users')
    .select('id, name, public_profile')
    .eq('id', targetId)
    .single();

  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const isPublic = target.public_profile ?? false;
  const status = isPublic ? 'accepted' : 'pending';

  const { data: friendship, error } = await supabase
    .from('friendships')
    .insert({ user_id: session.user.id, friend_id: target.id, status })
    .select('id')
    .single();

  if (error?.code === '23505') return NextResponse.json({ error: 'Friend request already sent.' }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPublic) {
    await supabase.from('follows').upsert([
      { follower_id: session.user.id, following_id: target.id },
      { follower_id: target.id, following_id: session.user.id },
    ], { onConflict: 'follower_id,following_id' });

    await supabase.from('notifications').insert({
      user_id: target.id,
      type: 'friend_accepted',
      title: `${session.user.name ?? 'Someone'} added you as a friend`,
      body: null,
      data: { sender_id: session.user.id },
      read: false,
    });
  } else {
    await supabase.from('notifications').insert({
      user_id: target.id,
      type: 'friend_request',
      title: `${session.user.name ?? 'Someone'} sent you a friend request`,
      body: 'Accept or decline in your profile',
      data: { friendship_id: friendship.id, sender_id: session.user.id },
      read: false,
    });
  }

  trackChallengeAction(session.user.id, 'friend');

  return NextResponse.json({ success: true, name: target.name, auto_accepted: isPublic });
}
