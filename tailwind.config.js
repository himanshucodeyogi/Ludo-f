/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Landscape phones: very little vertical room, so the HUD goes compact
        short: { raw: '(max-height: 500px)' },
      },
      colors: {
        ludo: {
          red: '#EF4444',
          'red-light': '#F87171',
          'red-dark': '#B91C1C',
          green: '#10B981',
          'green-light': '#34D399',
          'green-dark': '#047857',
          yellow: '#F59E0B',
          'yellow-light': '#FBBF24',
          'yellow-dark': '#B45309',
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
          'blue-dark': '#1D4ED8',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s infinite',
      }
    },
  },
  plugins: [],
}
