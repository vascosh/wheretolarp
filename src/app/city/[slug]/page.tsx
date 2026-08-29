import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { City, Location, Event } from '@/lib/types';
import CityPageClient from './CityPageClient';
import type { Metadata } from 'next';

interface CityPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { data: city } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!city) return { title: 'City Not Found — Where To LARP' };

  return {
    title: `${city.name} — Where To LARP`,
    description: city.tagline ?? `Curated events and social spaces in ${city.name}.`,
  };
}

export async function generateStaticParams() {
  return [{ slug: 'new-york' }, { slug: 'london' }, { slug: 'miami' }];
}

export const dynamic = 'force-dynamic';

export default async function CityPage({ params }: CityPageProps) {
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (cityError || !cityData) {
    const CITY_NAMES: Record<string, string> = {
      'new-york': 'New York',
      london: 'London',
      miami: 'Miami',
    };
    const cityName = CITY_NAMES[params.slug];
    if (!cityName) notFound();

    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-8 pt-nav">
        <div className="max-w-lg text-center">
          <p className="eyebrow mb-5">Database Setup Required</p>
          <h1 className="headline-editorial text-5xl sm:text-6xl mb-6 capitalize">{cityName}</h1>
          <div className="rule-champagne-dim mb-6" />
          <p className="font-sans text-peat/70 text-sm leading-relaxed mb-6">
            The database tables haven&apos;t been created yet. Run the SQL files in the{' '}
            <a
              href="https://supabase.com/dashboard/project/dlamwzkiicqrvzqxzyet/editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-dark underline underline-offset-2"
            >
              Supabase SQL Editor
            </a>
            :
          </p>
          <ol className="text-left space-y-3 font-sans text-sm text-peat/75 mb-8">
            <li className="flex gap-3">
              <span className="text-gold-dark font-medium shrink-0">1.</span>
              <span>
                Run <code className="text-gold-dark bg-forest/5 px-1 rounded">supabase/schema.sql</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-dark font-medium shrink-0">2.</span>
              <span>
                Run <code className="text-gold-dark bg-forest/5 px-1 rounded">supabase/schema_v2_events.sql</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-dark font-medium shrink-0">3.</span>
              <span>
                Run <code className="text-gold-dark bg-forest/5 px-1 rounded">supabase/seed.sql</code> and{' '}
                <code className="text-gold-dark bg-forest/5 px-1 rounded">supabase/seed_events.sql</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-dark font-medium shrink-0">4.</span>
              <span>Refresh this page</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  const city = cityData as City;
  const today = new Date().toISOString().split('T')[0];

  // Fetch spaces and upcoming events in parallel
  const [{ data: spacesData }, { data: eventsData }] = await Promise.all([
    supabase
      .from('locations')
      .select('*')
      .eq('city_id', city.id)
      .eq('is_approved', true)
      .order('name'),
    supabase
      .from('events')
      .select('*')
      .eq('city_id', city.id)
      .eq('is_approved', true)
      .gte('event_date', today)
      .order('event_date', { ascending: true }),
  ]);

  return (
    <CityPageClient
      city={city}
      events={(eventsData ?? []) as Event[]}
      spaces={(spacesData ?? []) as Location[]}
    />
  );
}
