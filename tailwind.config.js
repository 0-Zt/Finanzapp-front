/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        neon: {
          surface: '#0b1220',
          primary: '#2563eb',
          accent: '#38bdf8',
          glow: '#22d3ee',
        },
        // Semantic text colors (WCAG AA compliant)
        // Light mode: min 4.5:1 contrast on #f8fafc background
        // Dark mode: min 4.5:1 contrast on #0b1220 background
        text: {
          primary: {
            DEFAULT: '#0f172a',   // slate-900, 15.4:1 contrast
            dark: '#f1f5f9',      // slate-100, 13.8:1 contrast
          },
          secondary: {
            DEFAULT: '#475569',   // slate-600, 7.1:1 contrast (was slate-500 at 5.3:1)
            dark: '#cbd5e1',      // slate-300, 10.5:1 contrast
          },
          tertiary: {
            DEFAULT: '#64748b',   // slate-500, 5.3:1 contrast (meets AA for large text)
            dark: '#94a3b8',      // slate-400, 6.7:1 contrast
          },
          muted: {
            DEFAULT: '#64748b',   // slate-500, minimum for AA
            dark: '#94a3b8',      // slate-400
          },
        },
        // Semantic status colors (enhanced for low brightness screens)
        status: {
          success: {
            DEFAULT: '#059669',   // emerald-600, better contrast than 500
            dark: '#34d399',      // emerald-400
            bg: '#d1fae5',        // emerald-100
            'bg-dark': 'rgba(52, 211, 153, 0.15)',
          },
          warning: {
            DEFAULT: '#d97706',   // amber-600
            dark: '#fbbf24',      // amber-400
            bg: '#fef3c7',        // amber-100
            'bg-dark': 'rgba(251, 191, 36, 0.15)',
          },
          danger: {
            DEFAULT: '#dc2626',   // red-600, better than rose-500
            dark: '#f87171',      // red-400
            bg: '#fee2e2',        // red-100
            'bg-dark': 'rgba(248, 113, 113, 0.15)',
          },
          info: {
            DEFAULT: '#2563eb',   // brand-600
            dark: '#60a5fa',      // brand-400
            bg: '#dbeafe',        // brand-100
            'bg-dark': 'rgba(96, 165, 250, 0.15)',
          },
        },
        // Enhanced border colors (more visible on light backgrounds)
        border: {
          subtle: {
            DEFAULT: 'rgba(148, 163, 184, 0.4)',  // slate-400/40 (was 200/70)
            dark: 'rgba(71, 85, 105, 0.5)',      // slate-600/50
          },
          default: {
            DEFAULT: 'rgba(148, 163, 184, 0.5)', // slate-400/50
            dark: 'rgba(71, 85, 105, 0.6)',
          },
          emphasis: {
            DEFAULT: 'rgba(100, 116, 139, 0.5)', // slate-500/50
            dark: 'rgba(100, 116, 139, 0.6)',
          },
        },
      },
      boxShadow: {
        glass: '0 18px 45px -36px rgba(15, 23, 42, 0.45)',
        'neon-card': '0 16px 36px -30px rgba(37, 99, 235, 0.35)',
        // Enhanced card shadows for better depth perception
        'card-sm': '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-md': '0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.05)',
      },
      // Typography scale (consistent hierarchy)
      fontSize: {
        // Display / Hero
        'display': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        // Headings
        'heading-lg': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        // Subheadings
        'subheading': ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }],
        'subheading-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        // Body
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        // Caption / Labels
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-xs': ['0.625rem', { lineHeight: '1.3', letterSpacing: '0.04em', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
