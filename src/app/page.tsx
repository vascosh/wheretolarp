import { supabase } from '@/lib/supabase';
import EditorialLanding, { type LandingCity } from '@/components/EditorialLanding';

export const dynamic = 'force-dynamic';

const CITY_META: Record<string, { country: string; tagline: string }> = {
  'new-york': {
    country: 'United States',
    tagline: 'Dress like you summer somewhere better.',
  },
  london: {
    country: 'United Kingdom',
    tagline: "Old money doesn't announce itself. Neither should you.",
  },
  miami: {
    country: 'United States',
    tagline: 'Art Basel is in December. The rest is just practice.',
  },
};

const SLUG_ORDER = ['new-york', 'london', 'miami'];

export default async function HomePage() {
  const { data: citiesData } = await supabase.from('cities').select('id, name, slug');

  const today = new Date().toISOString().split('T')[0];
  const countMap: Record<string, { spaces: number; events: number }> = {};

  if (citiesData) {
    await Promise.all(
      citiesData.map(async (city) => {
        const [{ count: spaces }, { count: events }] = await Promise.all([
          supabase
            .from('locations')
            .select('id', { count: 'exact', head: true })
            .eq('city_id', city.id)
            .eq('is_approved', true),
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('city_id', city.id)
            .eq('is_approved', true)
            .gte('event_date', today),
        ]);
        countMap[city.slug] = { spaces: spaces ?? 0, events: events ?? 0 };
      })
    );
  }

  const cities: LandingCity[] = SLUG_ORDER.map((slug) => {
    const cityData = citiesData?.find((c) => c.slug === slug);
    const meta = CITY_META[slug] ?? { country: '', tagline: '' };
    const counts = countMap[slug] ?? { spaces: 0, events: 0 };
    return {
      slug,
      name: cityData?.name ?? slug,
      country: meta.country,
      tagline: meta.tagline,
      events: counts.events,
      spaces: counts.spaces,
    };
  });

  // Real spot names for the scrolling marquee (deduped, capped for a tidy loop).
  const { data: locationRows } = await supabase
    .from('locations')
    .select('name')
    .eq('is_approved', true)
    .limit(60);
  const locationNames = Array.from(
    new Set((locationRows ?? []).map((r) => r.name).filter(Boolean))
  ).slice(0, 18);

  return <EditorialLanding cities={cities} locationNames={locationNames} />;
}
