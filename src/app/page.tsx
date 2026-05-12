import Hero from '@/components/Hero';
import CitySelector from '@/components/CitySelector';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <Hero />
      <CitySelector />
    </>
  );
}
