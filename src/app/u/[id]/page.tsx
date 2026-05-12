import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import type { Metadata } from 'next';
import AddFriendButton from './AddFriendButton';
import UserActions from '@/components/UserActions';
import ProfileStats from '@/components/ProfileStats';
import FriendPlansSection from '@/components/FriendPlansSection';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase.from('users').select('name').eq('id', params.id).single();
  return { title: data?.name ? `${data.name} — Where To LARP` : 'Profile — Where To LARP' };
}

function Avatar({ name, image, size = 80 }: { name: string; image?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (image) {
    return <img src={image} alt={name} referrerPolicy="no-referrer"
      className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-navy shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #C9A96E, #b8944d)', fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function mutualLabel(mutuals: { name: string | null }[]) {
  if (mutuals.length === 0) return null;
  const first = mutuals[0].name ?? 'Someone';
  if (mutuals.length === 1) return <><span className="text-cream/50">{first}</span> larps together</>;
  const rest = mutuals.length - 1;
  return <><span className="text-cream/50">{first}</span> and {rest} {rest === 1 ? 'other' : 'others'} larp together</>;
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const { data: user } = await supabase
    .from('users')
    .select('id, name, bio, avatar_url, username, show_email, email, public_profile, created_at')
    .eq('id', params.id)
    .single();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-nav"
        style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
        <div className="text-center">
          <p className="font-serif text-cream/40 text-2xl mb-3">User not found</p>
          <Link href="/" className="font-sans text-xs text-champagne/60 hover:text-champagne tracking-widest uppercase">← Home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  // Determine friendship status between viewer and profile owner
  let friendStatus: FriendStatus = 'none';
  let friendshipId: string | undefined;

  if (session?.user?.id && !isOwnProfile) {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id, status, user_id, friend_id')
      .or(
        `and(user_id.eq.${session.user.id},friend_id.eq.${user.id}),and(user_id.eq.${user.id},friend_id.eq.${session.user.id})`
      )
      .maybeSingle();

    if (friendship) {
      friendshipId = friendship.id;
      if (friendship.status === 'accepted') {
        friendStatus = 'accepted';
      } else if (friendship.status === 'pending') {
        friendStatus = friendship.user_id === session.user.id ? 'pending_sent' : 'pending_received';
      }
    }
  }

  // Compute mutual friends (only if logged in and not own profile)
  let mutualFriends: { id: string; name: string | null; avatar_url: string | null }[] = [];
  if (session?.user?.id && !isOwnProfile) {
    const [{ data: myFriendships }, { data: theirFriendships }] = await Promise.all([
      supabase.from('friendships').select('user_id, friend_id').eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`),
      supabase.from('friendships').select('user_id, friend_id').eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
    ]);
    const myFriendIds = (myFriendships ?? []).map(f =>
      f.user_id === session.user.id ? f.friend_id : f.user_id
    );
    const theirFriendIds = new Set(
      (theirFriendships ?? []).map(f => f.user_id === user.id ? f.friend_id : f.user_id)
    );
    const mutualIds = myFriendIds.filter(id => theirFriendIds.has(id));
    if (mutualIds.length > 0) {
      const { data: mutualData } = await supabase
        .from('users').select('id, name, avatar_url').in('id', mutualIds).limit(5);
      mutualFriends = mutualData ?? [];
    }
  }

  // Private profile — show minimal card with Add Friend, hide stats
  // Friends can see the full profile
  if (!user.public_profile && !isOwnProfile && friendStatus !== 'accepted') {
    return (
      <div className="min-h-screen pt-nav"
        style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />

        <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-14">
          <div className="rounded-2xl p-8 text-center mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex justify-center mb-5">
              <Avatar name={user.name ?? 'Member'} image={user.avatar_url} size={88} />
            </div>
            <h1 className="font-serif text-cream text-2xl font-semibold mb-1">{user.name ?? 'Member'}</h1>
            {user.username && (
              <p className="font-sans text-champagne/50 text-xs mb-2 tracking-wider">@{user.username}</p>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-cream/30">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-sans text-[10px] text-cream/30 tracking-widest uppercase">Private Profile</span>
            </div>

            {mutualFriends.length > 0 && (
              <p className="font-sans text-xs text-cream/30 mt-4 mb-1">
                {mutualLabel(mutualFriends)}
              </p>
            )}

            {session?.user ? (
              <>
                <AddFriendButton
                  targetId={user.id}
                  initialStatus={friendStatus}
                  friendshipId={friendshipId}
                />
                <UserActions
                  targetId={user.id}
                  targetName={user.name}
                  showMessage
                />
              </>
            ) : (
              <p className="font-sans text-cream/20 text-xs mt-4">
                Sign in to connect
              </p>
            )}
          </div>

          <div className="text-center">
            <Link href="/" className="font-sans text-xs text-cream/20 hover:text-cream/40 tracking-widest uppercase transition-colors">
              Where To LARP
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Public profile (or own profile) — show full details
  const isFriend = isOwnProfile || friendStatus === 'accepted';

  const [
    { count: planCount },
    { count: friendCount },
  ] = await Promise.all([
    supabase.from('larp_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('friendships').select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq('status', 'accepted'),
  ]);

  const { data: friendPlans } = isFriend
    ? await supabase.from('larp_plans')
        .select('id, spot_name, spot_neighborhood, spot_category, plan_date, plan_time, notes')
        .eq('user_id', user.id)
        .order('plan_date', { ascending: true })
    : { data: null };

  const fc = friendCount ?? 0;
  const initialStats = {
    planCount: planCount ?? 0,
    followerCount: fc,
    followingCount: fc,
    friendCount: fc,
  };

  const joinedYear = new Date(user.created_at).getFullYear();
  const showEmail = user.show_email && isOwnProfile;

  return (
    <div className="min-h-screen pt-nav"
      style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(201,169,110,0.05) 0%, transparent 70%)' }} />

      <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-14">

        {/* Profile card */}
        <div className="rounded-2xl p-8 text-center mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-center mb-5">
            <Avatar name={user.name ?? 'Member'} image={user.avatar_url} size={88} />
          </div>
          <h1 className="font-serif text-cream text-2xl font-semibold mb-1">{user.name ?? 'Member'}</h1>
          {user.username && (
            <p className="font-sans text-champagne/50 text-xs mb-0.5 tracking-wider">@{user.username}</p>
          )}
          <p className="font-sans text-cream/20 text-xs tracking-wide">Member since {joinedYear}</p>
          {user.bio && (
            <p className="font-sans text-cream/50 text-sm leading-relaxed mt-3 max-w-xs mx-auto">{user.bio}</p>
          )}

          <div className="mt-7 pt-7 border-t border-white/[0.06]">
            <ProfileStats
              userId={user.id}
              initialStats={initialStats}
              isOwnProfile={isOwnProfile}
            />
          </div>

          {mutualFriends.length > 0 && (
            <p className="font-sans text-xs text-cream/30 mt-5 pt-5 border-t border-white/[0.06]">
              {mutualLabel(mutualFriends)}
            </p>
          )}

          {isOwnProfile ? (
            <div className="mt-6 flex gap-3 justify-center">
              <Link href="/profile"
                className="px-5 py-2 rounded-full bg-champagne/10 border border-champagne/20 text-champagne font-sans text-xs tracking-widest uppercase hover:bg-champagne/20 transition-all">
                My Profile
              </Link>
              <Link href="/settings"
                className="px-5 py-2 rounded-full border border-white/[0.08] text-cream/40 font-sans text-xs tracking-widest uppercase hover:text-cream/60 hover:border-white/[0.15] transition-all">
                Settings
              </Link>
            </div>
          ) : session?.user ? (
            <>
              <AddFriendButton
                targetId={user.id}
                initialStatus={friendStatus}
                friendshipId={friendshipId}
              />
              <UserActions
                targetId={user.id}
                targetName={user.name}
                showMessage
              />
            </>
          ) : null}
        </div>

        {/* Plans & calendar — visible to friends and own profile */}
        {isFriend && friendPlans && (
          <div className="mb-6">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/20 mb-3 px-1">
              {isOwnProfile ? 'Your Plans' : `${user.name?.split(' ')[0] ?? 'Their'}'s Plans`}
            </p>
            <FriendPlansSection
              plans={friendPlans}
              firstName={user.name?.split(' ')[0] ?? 'Their'}
            />
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="font-sans text-xs text-cream/20 hover:text-cream/40 tracking-widest uppercase transition-colors">
            Where To LARP
          </Link>
        </div>
      </div>
    </div>
  );
}
