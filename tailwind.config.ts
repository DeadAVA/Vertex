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
          DEFAULT: '#09090f',
          surface: '#111118',
          elevated: '#16161f',
          border: '#1e1e2e',
        },
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          glow: 'rgba(124,58,237,0.25)',
          '50': '#f5f3ff',
          '100': '#ede9fe',
          '500': '#8b5cf6',
          '600': '#7c3aed',
          '700': '#6d28d9',
        },
        accent: {
          DEFAULT: '#06b6d4',
          glow: 'rgba(6,182,212,0.2)',
        },
        tx: {
          DEFAULT: '#e2e8f0',
          muted: '#94a3b8',
          subtle: '#475569',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(124,58,237,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6,182,212,0.08) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(124,58,237,0.3)',
        'glow': '0 0 24px rgba(124,58,237,0.35)',
        'glow-lg': '0 0 48px rgba(124,58,237,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
