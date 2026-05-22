import type { Metadata } from 'next';
import PortfolioClient from './PortfolioClient';

// Overrides root layout metadata so the tab title / OG / Twitter cards
// don't reveal Where2Larp branding on this standalone page.
export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Account overview.',
  keywords: [],
  openGraph: {
    title: 'Portfolio',
    description: 'Account overview.',
    type: 'website',
  },
  twitter: {
    title: 'Portfolio',
    description: 'Account overview.',
  },
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
