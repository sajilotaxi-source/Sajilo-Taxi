/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FFC107', // Yellow
        'secondary': '#0D6EFD', // Blue
        'light-gray': '#F8F9FA',
        'dark': '#333333',
        'success': '#28A745', // Green
        'danger': '#DC3545', // Red
        'black': '#000000',
        'white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}