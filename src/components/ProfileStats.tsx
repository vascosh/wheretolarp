'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import TierBadge from './TierBadge';
import { getTier } from '@/lib/tiers';
import FollowListModal from './FollowListModal';

interface Stats {
  planCount: number;
  followerCount: number;
  followingCount: number;
  friendCount: number;
}

interface Props {
  userId: string;
  initialStats: Stats;
  isOwnProfile?: boolean;
}

export default function ProfileStats({ userId, initialStats, isOwnProfile = false }: Props) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>(initialStats);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [modal, setModal] = useState<'followers' | 'following' | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(fetchStats, 15_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!session?.user?.id || isOwnProfile) return;
    fetch(`/api/users/${userId}/follow`)
      .then(r => r.json())
      .then(d => setFollowing(d.following ?? false))
      .catch(() => {});
  }, [session?.user?.id, userId, isOwnProfile]);

  async function toggleFollow() {
    setFollowLoading(true);
    const method = following ? 'DELETE' : 'POST';
    const res = await fetch(`/api/users/${userId}/follow`, { method });
    if (res.ok) {
      setFollowing(!following);
      await fetchStats();
    }
    setFollowLoading(false);
  }

  const score = stats.planCount + stats.followerCount;
  const tier = getTier(score);

  const statItems = [
    { value: stats.planCount, label: 'Plans', onClick: undefined },
    { value: stats.followingCount, label: 'Following', onClick: () => setModal('following') },
    { value: stats.followerCount, label: 'Followers', onClick: () => setModal('followers') },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {tier !== 'none' && <TierBadge tier={tier} size="md" />}

        <div className="flex items-center justify-center gap-6 sm:gap-8">
          {statItems.map(({ value, label, onClick }, i) => (
            <div key={label} className="flex items-center gap-6 sm:gap-8">
              {i > 0 && <div className="w-px h-8 bg-white/[0.06]" />}
              {onClick ? (
                <button onClick={onClick} className="text-center group">
                  <p className="font-serif text-champagne text-2xl font-semibold leading-none group-hover:text-champagne/80 transition-colors">{value}</p>
                  <p className="font-sans text-[10px] text-cream/25 tracking-widest uppercase mt-1 group-hover:text-cream/40 transition-colors underline underline-offset-2 decoration-cream/10">{label}</p>
                </button>
              ) : (
                <div className="text-center">
                  <p className="font-serif text-champagne text-2xl font-semibold leading-none">{value}</p>
                  <p className="font-sans text-[10px] text-cream/25 tracking-widest uppercase mt-1">{label}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isOwnProfile && session?.user?.id && session.user.id !== userId && (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`px-5 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all disabled:opacity-50 ${
              following
                ? 'bg-white/[0.06] border border-white/[0.12] text-cream/50 hover:bg-white/[0.10] hover:text-cream/70'
                : 'bg-champagne/10 border border-champagne/20 text-champagne hover:bg-champagne/20'
            }`}
          >
            {followLoading ? '…' : following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {modal && (
        <FollowListModal
          type={modal}
          userId={userId}
          isOwnProfile={isOwnProfile}
          onClose={() => setModal(null)}
          onStatsChange={fetchStats}
        />
      )}
    </>
  );
}
