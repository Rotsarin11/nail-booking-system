/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Barlow Condensed"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        body: ['"Barlow"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        display: ['"Manrope"', '"Noto Sans Thai"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
