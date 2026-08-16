/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theater: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#111726',
          800: '#161f33',
          750: '#1a2640',
          700: '#1e2942',
          600: '#2d3b5c',
        },
        cinema: {
          red: '#9C1018',       // Kinosessel Rot — tiefes Kinorot (Samt-Sessel)
          'red-hover': '#780C14',
          'red-deep': '#580008',
          green: '#00FF41',     // Matrix Grün — Phosphor-Neon
          'green-dim': '#00C230',
          'green-dark': '#003B18',
          gold: '#f5c518',
          'gold-dark': '#e5a100',
          purple: '#8b5cf6',
          neon: '#00FF41',      // Matrix Grün (ersetzt Cyan)
          emerald: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'zoomIn': 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'borderFlow': 'borderFlow 4s linear infinite',
        'filmStrip': 'filmStrip 20s linear infinite',
        'neonPulse': 'neonPulse 2s ease-in-out infinite',
        'heartPop': 'heartPop 0.35s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(229, 9, 20, 0.85)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        borderFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '300% 50%' },
        },
        filmStrip: {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        neonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        heartPop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.45)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
