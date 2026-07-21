/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upa: {
          blue: '#0033A0',   // primary: logo, botones, seleccion, headers
          hover: '#00287A',   // hover de acciones primarias
          light: '#E5EEFF',   // sidebar activo, badges suaves, highlight cards
        },
      },
    },
  },
  plugins: [],
}
