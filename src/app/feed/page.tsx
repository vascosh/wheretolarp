import type { Metadata } from 'next';
import FeedClient from './FeedClient';

export const metadata: Metadata = {
  title: 'The Society Papers — Where To LARP',
  description: 'The Society Papers — LARPs filed daily by members and friends of the Society.',
};

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return <FeedClient />;
}
