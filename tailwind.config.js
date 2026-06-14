/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0f2350', 700: '#16306b', 600: '#1e3d85', 50: '#eef2fb' },
        gold:  { DEFAULT: '#c9a227', 600: '#b08e1f', 50: '#fbf6e6' }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
