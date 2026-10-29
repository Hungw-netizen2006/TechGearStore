/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gear: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#3b82f6',
          accent: '#06b6d4',
          neon: '#10b981',
        }
      }
    },
  },
  plugins: [],
}

