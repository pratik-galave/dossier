/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: '#E5E7EB',
        'gray-subtle': '#F9FAFB',
      },
      maxWidth: {
        content: '1120px',
      },
    },
  },
  plugins: [],
}
