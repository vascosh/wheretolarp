import type { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Leaderboard — Where To LARP',
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
