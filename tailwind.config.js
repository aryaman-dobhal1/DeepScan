/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#070810',
        bg2:     '#0d0f1a',
        bg3:     '#111426',
        card:    '#13162a',
        border:  '#1e2240',
        border2: '#252a50',
        accent:  '#00f5c4',
        accent2: '#7c6fff',
        accent3: '#ff4f7b',
        warn:    '#ffb830',
        muted:   '#6b7299',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0,245,196,0.4)' },
          '50%':     { opacity: '0.6', boxShadow: '0 0 0 5px rgba(0,245,196,0)' },
        },
        scanLine: {
          '0%':   { top: '0%',   opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
