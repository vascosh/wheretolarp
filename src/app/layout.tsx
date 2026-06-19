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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Fontshare Gambetta — characterful display serif for editorial headlines */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=gambetta@300,400,500,600,700&display=swap"
        />
      </head>
      <body className="bg-cream text-charcoal antialiased">
        <Providers session={session}>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
        {/* Site-wide film-grain atmosphere (pointer-events-none, fixed) */}
        <div className="grain-overlay" aria-hidden />
      </body>
    </html>
  );
}
