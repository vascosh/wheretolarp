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
        // Characterful display serif (Fontshare Gambetta) — used large + with restraint
        display: ['var(--font-gambetta)', 'var(--font-playfair)', 'Georgia', 'serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        champagne: '#C9A96E',
        'champagne-light': '#E8D5B0',
        'champagne-dark': '#A07C45',
        navy: '#0A1628',
        'navy-light': '#142240',
        'navy-mid': '#1E3052',
        // Deeper near-black ink for full-bleed editorial sections
        ink: '#060D18',
        cream: '#FAF7F2',
        'cream-dark': '#F0EBE3',
        charcoal: '#2C2C2C',
        'charcoal-light': '#4A4A4A',
        muted: '#888888',
      },
      fontSize: {
        'editorial': ['clamp(3.5rem, 13vw, 11rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(10, 22, 40, 0.08)',
        'card-hover': '0 8px 32px rgba(10, 22, 40, 0.16)',
        'modal': '0 24px 80px rgba(10, 22, 40, 0.32)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
