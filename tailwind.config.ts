import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1A1A2E', light: '#2B2B47' },
        accent: { DEFAULT: '#E91E8C', soft: '#F8BBD9', bg: '#FCE7F1' },
        success: { DEFAULT: '#22C55E', bg: '#DCFCE7' },
        warning: { DEFAULT: '#F59E0B', bg: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', bg: '#FEE2E2' },
        surface: { DEFAULT: '#FFFFFF', 2: '#F5F5F5', 3: '#FAFAFA' },
        border: { DEFAULT: '#E5E7EB', strong: '#D1D5DB' },
        textc: { DEFAULT: '#111827', muted: '#6B7280', subtle: '#9CA3AF' },
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '22': '5.5rem',
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px', input: '10px', btn: '12px' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,.08)',
        'cta-accent': '0 8px 24px rgba(233,30,140,.3)',
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)', opacity: '.5' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.85', transform: 'scale(1.03)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up .25s cubic-bezier(.2,.7,.3,1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
