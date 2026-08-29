import type { Metadata } from 'next';
import ChallengesClient from './ChallengesClient';

export const metadata: Metadata = { title: 'Field Exercises — Where To LARP' };

export default function ChallengesPage() {
  return <ChallengesClient />;
}
