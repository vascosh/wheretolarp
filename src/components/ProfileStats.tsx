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
      <div className="flex flex-col items-center gap-6">
        {tier !== 'none' && <TierBadge tier={tier} size="md" />}

        <div className="flex items-stretch justify-center w-full max-w-xs">
          {statItems.map(({ value, label, onClick }, i) => (
            <div key={label} className="flex items-stretch flex-1">
              {i > 0 && <div className="w-px self-stretch bg-champagne/15" />}
              {onClick ? (
                <button onClick={onClick} className="flex-1 text-center group px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink rounded-sm">
                  <p className="font-display text-champagne text-3xl leading-none numeral !text-champagne group-hover:text-champagne-light transition-colors">{value}</p>
                  <p className="eyebrow-muted mt-2 group-hover:text-champagne/70 transition-colors">{label}</p>
                </button>
              ) : (
                <div className="flex-1 text-center px-2">
                  <p className="font-display text-champagne text-3xl leading-none">{value}</p>
                  <p className="eyebrow-muted mt-2">{label}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isOwnProfile && session?.user?.id && session.user.id !== userId && (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
              following
                ? 'btn-editorial-ghost'
                : 'btn-editorial'
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
