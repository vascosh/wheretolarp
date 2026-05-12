import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/profile');

  // Quick onboarding check — new Google users get redirected to set up profile
  const { data: onboardCheck } = await supabase
    .from('users').select('onboarded').eq('id', session.user.id).single();
  if (onboardCheck && onboardCheck.onboarded === false) redirect('/onboarding');

  const [{ data: plans }, { data: friendships }, { data: profileData }] = await Promise.all([
    supabase
      .from('larp_plans')
      .select('*')
      .eq('user_id', session.user.id)
      .order('plan_date', { ascending: true }),
    supabase
      .from('friendships')
      .select('id, status, user_id, friend_id')
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`),
    supabase
      .from('users')
      .select('name, bio, avatar_url, username, show_email, onboarded')
      .eq('id', session.user.id)
      .single(),
  ]);

  // Friends = followers = following (no separate follows table needed)
  const friendCount = (friendships ?? []).filter(f => f.status === 'accepted').length;

  const acceptedFriendIds = (friendships ?? [])
    .filter(f => f.status === 'accepted')
    .map(f => f.user_id === session.user.id ? f.friend_id : f.user_id);

  const pendingIncoming = (friendships ?? [])
    .filter(f => f.status === 'pending' && f.friend_id === session.user.id)
    .map(f => ({ friendshipId: f.id, userId: f.user_id }));

  const { data: friendUsers } = acceptedFriendIds.length
    ? await supabase.from('users').select('id, name, email, avatar_url').in('id', acceptedFriendIds)
    : { data: [] };

  const pendingUserIds = pendingIncoming.map(p => p.userId);
  const { data: pendingUsers } = pendingUserIds.length
    ? await supabase.from('users').select('id, name, email, avatar_url').in('id', pendingUserIds)
    : { data: [] };

  const pendingWithMeta = pendingIncoming.map(p => ({
    friendshipId: p.friendshipId,
    ...((pendingUsers ?? []).find(u => u.id === p.userId) ?? { id: p.userId, name: null, email: null, avatar_url: null }),
  }));

  const enrichedUser = {
    ...session.user,
    name: profileData?.name ?? session.user.name,
    image: profileData?.avatar_url ?? session.user.image,
  };

  return (
    <ProfileClient
      user={enrichedUser}
      initialPlans={plans ?? []}
      initialFriends={friendUsers ?? []}
      initialPending={pendingWithMeta}
      initialShowEmail={profileData?.show_email ?? true}
      username={profileData?.username ?? null}
      initialBio={profileData?.bio ?? ''}
      initialFollowerCount={friendCount}
      initialFollowingCount={friendCount}
    />
  );
}
