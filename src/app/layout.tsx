import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Type is Helvetica Neue via the system stack (see --font-helvetica in
// globals.css) — no webfont, no licence, no network request.

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Where To LARP — A Field Guide to Looking the Part',
  description:
    'A curated register of the most photogenic, aspirational spots in New York, London, and Miami. Dress the part. Show up. Get the photo. Nobody needs to know.',
  keywords: ['LARP', 'lifestyle', 'New York', 'London', 'Miami', 'old money', 'fashion', 'locations'],
  openGraph: {
    title: 'Where To LARP',
    description: 'A curated register of the most aspirational spots in the world\'s greatest cities.',
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
    <html lang="en">
      <body className="bg-parchment text-peat antialiased">
        <Providers session={session}>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
