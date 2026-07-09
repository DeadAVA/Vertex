import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#07070a',
          surface: '#0e0e13',
          elevated: '#141419',
          border: '#1e1e28',
        },
        primary: {
          DEFAULT: '#e56517',
          hover: '#cc5813',
          glow: 'rgba(229,101,23,0.2)',
          '50': '#fff7ed',
          '100': '#ffedd5',
          '500': '#f97316',
          '600': '#e56517',
          '700': '#cc5813',
        },
        accent: {
          DEFAULT: '#64748b',
        },
        tx: {
          DEFAULT: '#f1f5f9',
          muted: '#8b95a7',
          subtle: '#454d5c',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s ease',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}

export default config
