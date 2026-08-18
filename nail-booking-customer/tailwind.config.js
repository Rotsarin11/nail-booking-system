/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['"Noto Sans Thai"', '"Manrope"', 'system-ui', 'sans-serif'],
        num: ['"Manrope"', '"Noto Sans Thai"', 'sans-serif'],
      },
      colors: {
        rose: {
          DEFAULT: '#3a5bbf',
          hover: '#3049a0',
          tile: '#eaf1fd',
          icon: '#4a68b8',
          soft: '#eaf0fc',
        },
        ink: '#1f2a44',
        body: '#3a4256',
        muted: '#727b8d',
        line: '#edf0f7',
        edge: '#e7ebf4',
        canvas: '#f8faff',
      },
      maxWidth: {
        app: '430px',
      },
    },
  },
  plugins: [],
}
