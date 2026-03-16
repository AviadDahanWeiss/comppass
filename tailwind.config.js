/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        space: {
          950: '#030712',
          900: '#080d1a',
          800: '#0f172a',
          700: '#1a2744',
          600: '#243358',
        },
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ping-slow': {
          '75%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up':    'fade-in-up 0.5s ease-out forwards',
        'fade-in':       'fade-in 0.4s ease-out forwards',
        'slide-in-right':'slide-in-right 0.4s ease-out forwards',
        shimmer:         'shimmer 2.5s linear infinite',
        'ping-slow':     'ping-slow 2s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
}
