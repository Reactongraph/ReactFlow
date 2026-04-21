/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        node: {
          input:      '#3b82f6',
          output:     '#10b981',
          processing: '#8b5cf6',
          api:        '#f59e0b',
          transform:  '#06b6d4',
          decision:   '#ec4899',
          ai:         '#7c3aed',
        },
      },
      boxShadow: {
        node:           '0 2px 8px 0 rgba(0,0,0,0.12)',
        'node-selected':'0 0 0 2px #6366f1, 0 4px 16px 0 rgba(99,102,241,0.2)',
        panel:          '2px 0 8px 0 rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':  'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.18s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
