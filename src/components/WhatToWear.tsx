'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { WhatToWear as WhatToWearType, OutfitDetails } from '@/lib/types';
import clsx from 'clsx';

interface WhatToWearProps {
  data: WhatToWearType | null;
  spotName?: string;
}

function OutfitTab({ details }: { details: OutfitDetails }) {
  const outfitItems = [
    ['Top', details.outfit.top],
    ['Bottom', details.outfit.bottom],
    ['Shoes', details.outfit.shoes],
    ['Bag', details.outfit.bag],
    ['Accessories', details.outfit.accessories],
  ] as [string, string][];

  return (
    <div className="space-y-8">
      {/* Brands */}
      <div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold-dark mb-3">
          Key Brands
        </p>
        <div className="flex flex-wrap gap-2">
          {details.brands.map((brand) => (
            <span
              key={brand}
              className="px-3 py-1.5 text-xs font-sans font-medium bg-forest/5 text-forest border border-gold/25 rounded-full tracking-wide"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* Outfit breakdown */}
      <div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold-dark mb-4">
          The Look
        </p>
        <div className="space-y-3">
          {outfitItems.map(([label, value]) => (
            <div key={label} className="flex gap-4">
              <span className="font-sans text-xs font-semibold tracking-wider uppercase text-peat/40 w-24 shrink-0 pt-0.5">
                {label}
              </span>
              <span className="font-sans text-sm text-peat leading-relaxed">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color palette */}
      <div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold-dark mb-2">
          Palette
        </p>
        <p className="font-sans text-sm text-peat/70 italic leading-relaxed">
          {details.color_palette}
        </p>
      </div>

      {/* Budget dupe */}
      <div className="border-t border-gold/15 pt-5">
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-peat/40 mb-2">
          Budget LARP
        </p>
        <p className="font-sans text-sm text-peat/55 italic leading-relaxed">
          {details.budget_dupe}
        </p>
      </div>
    </div>
  );
}

function WhatToWearModal({
  data,
  spotName,
  onClose,
}: {
  data: WhatToWearType;
  spotName: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'men' | 'women'>('men');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-forest/60 backdrop-blur-[8px] animate-backdrop-enter"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 bg-parchment-light w-full max-w-lg max-h-[85vh] rounded-[18px] shadow-modal overflow-hidden animate-modal-enter flex flex-col border border-gold/30">
        {/* Header */}
        <div className="relative bg-parchment px-6 py-7 sm:px-8 sm:py-8 shrink-0 border-b border-gold/20">
          <span className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-gold to-transparent" />
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow mb-3">What to Wear</p>
              <h2 className="headline-editorial text-3xl sm:text-4xl">
                {spotName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-peat/35 hover:text-gold-dark transition-colors duration-200 p-1 -mr-1 -mt-1 rounded-full"
              aria-label="Close"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M5 5L17 17M17 5L5 17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Tabs inside header */}
          <div className="flex mt-6 border-b border-gold/20">
            {(['men', 'women'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'flex-1 pb-3 text-xs font-sans tracking-[0.2em] uppercase transition-all duration-200 relative',
                  activeTab === tab
                    ? 'text-gold-dark'
                    : 'text-peat/40 hover:text-peat/70'
                )}
              >
                {tab === 'men' ? "Men's" : "Women's"} Look
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6 sm:px-8 sm:py-8">
          <OutfitTab details={activeTab === 'men' ? data.men : data.women} />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WhatToWear({ data, spotName }: WhatToWearProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data) return null;

  return (
    <>
      <div className="border-t border-gold/15">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gold/[0.06] transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-gold shrink-0"
            >
              <path
                d="M4 2C4 1.45 4.45 1 5 1H9C9.55 1 10 1.45 10 2V3H12C12.55 3 13 3.45 13 4V12C13 12.55 12.55 13 12 13H2C1.45 13 1 12.55 1 12V4C1 3.45 1.45 3 2 3H4V2Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M5 7H9M5 9.5H8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-gold-dark font-medium">
              What to Wear
            </span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-gold"
          >
            <path
              d="M4 2L8 6L4 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {mounted && isOpen && (
        <WhatToWearModal
          data={data}
          spotName={spotName || 'Style Guide'}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
