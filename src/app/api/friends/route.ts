import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { trackChallengeAction } from '@/lib/challenge-tracker';

// GET /api/friends — list friends + pending requests
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, status, user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (!friendships) return NextResponse.json({ friends: [], pending: [] });

  const accepted = friendships.filter(f => f.status === 'accepted');
  const pending = friendships.filter(f => f.status === 'pending' && f.friend_id === userId);

  const friendIds = accepted.map(f => f.user_id === userId ? f.friend_id : f.user_id);
  const pendingIds = pending.map(f => f.user_id);

  const { data: friends } = friendIds.length
    ? await supabase.from('users').select('id, email, name, avatar_url').in('id', friendIds)
    : { data: [] };

  const { data: pendingUsers } = pendingIds.length
    ? await supabase.from('users').select('id, email, name, avatar_url').in('id', pendingIds)
    : { data: [] };

  const pendingWithId = pending.map(f => ({
    friendshipId: f.id,
    ...(pendingUsers ?? []).find(u => u.id === f.user_id),
  }));

  return NextResponse.json({ friends: friends ?? [], pending: pendingWithId });
}

// POST /api/friends — send friend request by email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const { data: target } = await supabase
    .from('users')
    .select('id, email, name, public_profile')
    .eq('email', email)
    .single();

  if (!target) return NextResponse.json({ error: 'No user found with that email.' }, { status: 404 });
  if (target.id === session.user.id) return NextResponse.json({ error: "You can't add yourself." }, { status: 400 });

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
    // Auto-accepted — create mutual follows
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

    // Both users get the achievement when auto-accepted
    trackChallengeAction(session.user.id, 'friend');
    trackChallengeAction(target.id, 'friend');
  } else {
    // Pending — notify target of the request
    await supabase.from('notifications').insert({
      user_id: target.id,
      type: 'friend_request',
      title: `${session.user.name ?? 'Someone'} sent you a friend request`,
      body: 'Accept or decline in your profile',
      data: { friendship_id: friendship.id, sender_id: session.user.id },
      read: false,
    });
    // Award the challenge to the sender immediately on sending
    trackChallengeAction(session.user.id, 'friend');
  }

  return NextResponse.json({ success: true, name: target.name, auto_accepted: isPublic });
}

// PATCH /api/friends — accept request
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { friendshipId } = await req.json();

  // Fetch the friendship first so we know both user IDs
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('id, user_id, friend_id')
    .eq('id', friendshipId)
    .eq('friend_id', session.user.id)
    .single();

  if (fetchError || !friendship) return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create mutual follows when friendship is accepted
  await supabase.from('follows').upsert([
    { follower_id: friendship.user_id, following_id: friendship.friend_id },
    { follower_id: friendship.friend_id, following_id: friendship.user_id },
  ], { onConflict: 'follower_id,following_id' });

  // Notify the requester their request was accepted
  const { data: accepter } = await supabase.from('users').select('name').eq('id', session.user.id).single();
  await supabase.from('notifications').insert({
    user_id: friendship.user_id,
    type: 'friend_accepted',
    title: `${accepter?.name ?? 'Someone'} accepted your friend request`,
    body: null,
    data: { accepter_id: session.user.id },
    read: false,
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/friends?id=friendshipId
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const userId = session.user.id;

  // Fetch friendship to know both participants before deleting
  const { data: friendship } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .eq('id', id)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .maybeSingle();

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', id)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove mutual follows only if friendship was accepted (not just a cancelled request)
  if (friendship?.status === 'accepted') {
    await Promise.all([
      supabase.from('follows').delete()
        .eq('follower_id', friendship.user_id).eq('following_id', friendship.friend_id),
      supabase.from('follows').delete()
        .eq('follower_id', friendship.friend_id).eq('following_id', friendship.user_id),
    ]);
  }

  return NextResponse.json({ success: true });
}
