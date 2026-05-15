import DropCountdown from './DropCountdown';

export default function Hero() {
  return (
    <section className="bg-navy border-b border-champagne/10 pt-nav">
      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* 3-column grid: title left, countdown centred, third column empty for balance.
            On mobile (< md) it stacks: title above countdown. */}
        <div className="grid md:grid-cols-3 items-center gap-5 md:gap-6">
          <div className="text-center md:text-left">
            <h1 className="font-serif text-cream text-2xl sm:text-3xl font-semibold leading-tight mb-1">
              Start <span className="text-champagne italic">LARPing</span> Now
            </h1>
            <p className="font-sans text-cream/35 text-xs leading-relaxed">
              Dress the part. Show up. Get the photo.
            </p>
          </div>
          <div className="md:col-start-2 flex justify-center">
            <DropCountdown />
          </div>
          <div className="md:col-start-3 text-center md:text-right">
            <p className="font-serif text-cream text-xl sm:text-2xl italic leading-tight">
              A New Way Of{' '}
              <span className="text-champagne font-semibold">Exploring</span>{' '}
              Cities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
