/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102027',
        mist: '#f5f7f8',
        lime: '#c8f169',
        teal: '#11AEB3',
        'que-teal': '#11AEB3',
        'que-teal-dark': '#08777d',
        'plus-orange': '#FF9700',
        coral: '#ff6f4f',
        violet: '#6f5dd5',
      },
      boxShadow: {
        panel: '0 16px 36px rgba(16, 32, 39, 0.1)',
      },
    },
  },
  plugins: [],
};
