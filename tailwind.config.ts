import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // One stack everywhere. display/serif/sans all resolve to Helvetica Neue
        // so existing font-display / font-serif classes keep working unchanged.
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        /* ── Swiss Blue palette ────────────────────────────────────
           Neutral off-white paper, electric Klein blue, ink black.
           Token *names* are inherited from the previous scheme so the
           whole site re-tints without touching components. Read them
           by role, not by name:
             parchment* = paper / backgrounds
             forest*    = primary blue (headings, fills, dark surfaces)
             gold*      = accent blue (hairlines, eyebrows, micro-labels)
             peat       = body ink */
        parchment: '#F7F7F5',
        'parchment-light': '#FFFFFF',
        'parchment-dark': '#EBEBE7',
        forest: '#1B2FDE',
        'forest-light': '#3D4EE8',
        'forest-pale': '#E7E9FD',
        gold: '#4B5DF0',
        'gold-light': '#C3CBFA',
        'gold-dark': '#1B2FDE',
        burgundy: '#D4183D',
        peat: '#101114',

        /* Legacy names — remapped onto the same roles */
        champagne: '#4B5DF0',
        'champagne-light': '#C3CBFA',
        'champagne-dark': '#1B2FDE',
        navy: '#1B2FDE',
        'navy-light': '#3D4EE8',
        'navy-mid': '#6675F2',
        ink: '#101114',
        cream: '#FFFFFF',
        'cream-dark': '#F7F7F5',
        charcoal: '#101114',
        'charcoal-light': '#3A3C42',
        muted: '#6B6D75',
      },
      fontSize: {
        'editorial': ['clamp(3.5rem, 13vw, 11rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(16, 17, 20, 0.08)',
        'card-hover': '0 8px 32px rgba(16, 17, 20, 0.16)',
        'modal': '0 24px 80px rgba(16, 17, 20, 0.32)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234B5DF0' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
