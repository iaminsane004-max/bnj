/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdfbf7',
          100: '#faf2e6',
          200: '#f3dfc1',
          300: '#ecc694',
          400: '#e1a662',
          500: '#d5843b',
          600: '#c56c2d',
          700: '#a35224',
          800: '#834020',
          900: '#6c351c',
          950: '#3c1a0e',
        }
      }
    },
  },
  plugins: [],
}
