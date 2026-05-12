'use client';

import type { Category } from '@/lib/types';
import clsx from 'clsx';

const ALL_CATEGORIES: Category[] = [
  'Old Money',
  'Intellectual',
  'Art World',
  'Continental',
  'Hotel Lobby',
  'Luxury Retail',
  'Power Lunch',
  'Weekend Aristocrat',
  'Rooftop Bar',
];

interface FilterBarProps {
  activeCategory: Category | 'All';
  onCategoryChange: (category: Category | 'All') => void;
  categoryCounts: Partial<Record<Category, number>>;
  totalCount: number;
}

export default function FilterBar({
  activeCategory,
  onCategoryChange,
  categoryCounts,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="sticky top-16 z-20 bg-cream/95 backdrop-blur-sm border-b border-champagne/15 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {/* All pill */}
        <button
          onClick={() => onCategoryChange('All')}
          className={clsx(
            'filter-pill shrink-0',
            activeCategory === 'All' ? 'filter-pill-active' : 'filter-pill-inactive'
          )}
        >
          All ({totalCount})
        </button>

        {/* Category pills */}
        {ALL_CATEGORIES.map((category) => {
          const count = categoryCounts[category] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={clsx(
                'filter-pill shrink-0',
                activeCategory === category ? 'filter-pill-active' : 'filter-pill-inactive'
              )}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
