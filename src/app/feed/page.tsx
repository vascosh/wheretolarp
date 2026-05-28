import type { Metadata } from 'next';
import FeedClient from './FeedClient';

export const metadata: Metadata = {
  title: 'Feed — Where To LARP',
  description: 'The craziest LARPs from your friends and the city.',
};

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return <FeedClient />;
}
