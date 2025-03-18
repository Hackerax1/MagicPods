/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        mtg: {
          white: '#f9fafa',
          blue: '#0e68ab',
          black: '#150b00',
          red: '#d3202a',
          green: '#00733e',
          colorless: '#cac5c0',
          gold: '#d9a514',
        }
      }
    },
  },
  plugins: [],
}