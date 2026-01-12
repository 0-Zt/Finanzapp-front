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
      },
      boxShadow: {
        glass: '0 18px 45px -36px rgba(15, 23, 42, 0.45)',
        'neon-card': '0 16px 36px -30px rgba(37, 99, 235, 0.35)',
      },
    },
  },
  plugins: [],
};
