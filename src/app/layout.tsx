import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Where To LARP — Discover Aspirational Spots in Great Cities',
  description:
    'Find the most photogenic, aspirational spots in New York, London, and Paris. Dress the part. Own the room. Nobody needs to know.',
  keywords: ['LARP', 'lifestyle', 'New York', 'London', 'Paris', 'old money', 'fashion', 'locations'],
  openGraph: {
    title: 'Where To LARP',
    description: 'Discover the most aspirational spots in the world\'s greatest cities.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-cream text-charcoal antialiased">
        <Providers session={session}>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
