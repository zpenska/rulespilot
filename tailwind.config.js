/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5c4bd3',
          hover: '#4a3bb0',
          light: '#edecfb',
        },
        'bg-light': '#f4f4f6',
        'table-header': '#1c1c23',
        'table-border': '#e1e1e6',
        'active-badge': {
          bg: '#dbefe8',
          text: '#09a77d',
        },
      },
    },
  },
  plugins: [],
}
