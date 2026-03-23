/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-base':    '#1A1917',
        'dark-surface': '#262421',
        'dark-border':  '#413D37',
      },
    },
  },
  plugins: [],
}

