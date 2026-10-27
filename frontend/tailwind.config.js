/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          coral: '#ED6373', // Primary pink/coral from the logo and buttons
          light: '#FFF5F6', // Soft pink background tint
          dark: '#374151', // Dark slate for readable text
          gray: '#F9FAFB'  // Clean dashboard background
        }
      }
    },
  },
  plugins: [],
}