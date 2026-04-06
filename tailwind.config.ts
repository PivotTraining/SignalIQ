import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a2e',
        surface: '#f8f7f4',
        card: '#ffffff',
        lift: '#fafafa',
        hover: '#f0efec',
        rim: '#e5e4e0',
        gold: '#c9a84c',
        teal: '#2ec4b6',
        hot: '#e63946',
        warm: '#f4a261',
        fresh: '#2a9d8f',
        watch: '#6c757d',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'stream-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'stream-bar': 'stream-bar 2s ease-out',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(201, 168, 76, 0.3)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
