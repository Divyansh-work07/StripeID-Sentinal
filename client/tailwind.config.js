/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reserve: {
          dark: '#0B130E',
          card: '#122018',
          accent: '#10B981',
          gold: '#F59E0B',
          alert: '#EF4444',
          cyan: '#06B6D4'
        }
      }
    },
  },
  plugins: [],
}
