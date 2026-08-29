import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import type { Metadata } from 'next';
import AddFriendButton from './AddFriendButton';
import UserActions from '@/components/UserActions';
import ProfileStats from '@/components/ProfileStats';
import FriendPlansSection from '@/components/FriendPlansSection';

/** Routes /u/[id] support either a UUID or a custom username. UUID lookup is
 *  tried first when the slug shape matches; otherwise we look up by username. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function lookupKey(slug: string): { field: 'id' | 'username'; value: string } {
  return UUID_RE.test(slug)
    ? { field: 'id', value: slug }
    : { field: 'username', value: slug.toLowerCase() };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { field, value } = lookupKey(params.id);
  const { data } = await supabase.from('users').select('name').eq(field, value).maybeSingle();
  return { title: data?.name ? `${data.name} — Where To LARP` : 'Profile — Where To LARP' };
}

function Avatar({ name, image, size = 80 }: { name: string; image?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (image) {
    return <img src={image} alt={name} referrerPolicy="no-referrer"
      className="rounded-full object-cover border border-gold/40" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-sans font-semibold text-forest shrink-0 border border-gold/40"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #4B5DF0, #1B2FDE)', fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function mutualLabel(mutuals: { name: string | null }[]) {
  if (mutuals.length === 0) return null;
  const first = mutuals[0].name ?? 'Someone';
  if (mutuals.length === 1) return <><span className="font-display italic text-gold-dark">{first}</span> larps together</>;
  const rest = mutuals.length - 1;
  return <><span className="font-display italic text-gold-dark">{first}</span> and {rest} {rest === 1 ? 'other' : 'others'} larp together</>;
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const { field, value } = lookupKey(params.id);
  const { data: user } = await supabase
    .from('users')
    .select('id, name, bio, avatar_url, username, show_email, email, public_profile, created_at')
    .eq(field, value)
    .maybeSingle();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-nav bg-parchment text-peat">
        <div className="text-center px-6">
          <p className="eyebrow mb-5">Not in the Register</p>
          <h1 className="headline-editorial text-4xl sm:text-5xl mb-6">Member not found</h1>
          <Link href="/" className="link-underline">← Return home</Link>
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
      <div className="min-h-screen pt-nav bg-parchment text-peat">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-14">
          <div className="plate-frame mb-8">
            <div className="relative p-8 sm:p-10 text-center">
              <p className="eyebrow mb-6">A Member of the Register</p>
              <div className="flex justify-center mb-5">
                <Avatar name={user.name ?? 'Member'} image={user.avatar_url} size={88} />
              </div>
              <h1 className="headline-editorial text-3xl sm:text-4xl mb-1">{user.name ?? 'Member'}</h1>
              {user.username && (
                <p className="font-sans text-gold-dark text-[11px] mb-4 tracking-[0.25em] uppercase">@{user.username}</p>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-forest/25 mb-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-gold-dark/70">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="font-sans text-[10px] text-peat/50 tracking-[0.3em] uppercase">Private Dossier</span>
              </div>

              {mutualFriends.length > 0 && (
                <p className="font-sans text-xs text-peat/55 mt-5 mb-1">
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
                <p className="font-display italic text-peat/45 text-base mt-5">
                  Sign in to connect.
                </p>
              )}
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="eyebrow-muted hover:text-gold-dark transition-colors">
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
    <div className="min-h-screen pt-nav bg-parchment text-peat">
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-14">

        {/* Character sheet — specimen plate */}
        <div className="plate-frame mb-8">
          <div className="relative p-8 sm:p-10 text-center">
            <p className="eyebrow mb-6">A Member of the Register</p>
            <div className="flex justify-center mb-5">
              <Avatar name={user.name ?? 'Member'} image={user.avatar_url} size={88} />
            </div>
            <h1 className="headline-editorial text-3xl sm:text-4xl mb-1">{user.name ?? 'Member'}</h1>
            {user.username && (
              <p className="font-sans text-gold-dark text-[11px] mb-1 tracking-[0.25em] uppercase">@{user.username}</p>
            )}
            <p className="font-sans text-peat/40 text-[10px] tracking-[0.25em] uppercase">Member since {joinedYear}</p>
            {user.bio && (
              <p className="font-display italic text-peat/60 text-base leading-relaxed mt-4 max-w-xs mx-auto">{user.bio}</p>
            )}

            <div className="rule-champagne-dim my-7" />
            <ProfileStats
              userId={user.id}
              initialStats={initialStats}
              isOwnProfile={isOwnProfile}
            />

            {mutualFriends.length > 0 && (
              <p className="font-sans text-xs text-peat/55 mt-7 pt-7 border-t border-forest/10">
                {mutualLabel(mutualFriends)}
              </p>
            )}

            {isOwnProfile ? (
              <div className="mt-7 flex flex-wrap gap-3 justify-center">
                <Link href="/profile"
                  className="btn-editorial focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
                  My Profile
                </Link>
                <Link href="/settings"
                  className="btn-editorial-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light">
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
        </div>

        {/* Plans & calendar — visible to friends and own profile */}
        {isFriend && friendPlans && (
          <div className="mb-8">
            <p className="eyebrow-muted mb-4 px-1">
              {isOwnProfile ? 'Your Plans' : `${user.name?.split(' ')[0] ?? 'Their'}'s Plans`}
            </p>
            <FriendPlansSection
              plans={friendPlans}
              firstName={user.name?.split(' ')[0] ?? 'Their'}
            />
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="eyebrow-muted hover:text-gold-dark transition-colors">
            Where To LARP
          </Link>
        </div>
      </div>
    </div>
  );
}
