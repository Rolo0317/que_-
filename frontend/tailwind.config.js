/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18202f',
        mist: '#eef3f8',
        lime: '#c8f169',
        teal: '#1e8f86',
        coral: '#f9735b',
        violet: '#6f5dd5',
      },
      boxShadow: {
        panel: '0 16px 36px rgba(24, 32, 47, 0.08)',
      },
    },
  },
  plugins: [],
};
