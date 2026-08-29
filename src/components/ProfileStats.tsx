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

        {/* The standings — dotted-leader ledger rows */}
        <div className="w-full max-w-xs space-y-2.5 text-left">
          {statItems.map(({ value, label, onClick }) => (
            onClick ? (
              <button
                key={label}
                onClick={onClick}
                className="ledger-row w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light rounded-sm"
              >
                <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.25em] text-peat/45 group-hover:text-gold-dark transition-colors">{label}</span>
                <span className="leader" />
                <span className="shrink-0 font-display text-2xl leading-none text-forest tabular-nums group-hover:text-forest-light transition-colors">{value}</span>
              </button>
            ) : (
              <div key={label} className="ledger-row">
                <span className="shrink-0 font-sans text-[10px] uppercase tracking-[0.25em] text-peat/45">{label}</span>
                <span className="leader" />
                <span className="shrink-0 font-display text-2xl leading-none text-forest tabular-nums">{value}</span>
              </div>
            )
          ))}
        </div>

        {!isOwnProfile && session?.user?.id && session.user.id !== userId && (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment-light ${
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
