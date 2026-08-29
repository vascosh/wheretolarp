import type { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'The Standings — Where To LARP',
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
