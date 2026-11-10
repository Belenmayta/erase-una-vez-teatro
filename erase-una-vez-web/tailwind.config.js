/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Morados místicos extraídos de las letras, el hada y la luna del logo
        teatro: {
          50: '#fcf5ff',
          100: '#f7e6ff',
          200: '#eed0ff',
          300: '#e0aaff',
          400: '#c770ff',
          500: '#ac3aff',
          600: '#8e1bdf',
          700: '#7514b8', // Púrpura dominante de las letras
          800: '#5c1291',
          900: '#3e0a63',
          950: '#1e0333', // Fondo morado muy oscuro
        },
        // Dorados/Bronce de la luna y el marco circular
        oro: {
          300: '#fde68a',
          400: '#fbbf24', // Dorado brillante
          500: '#d97706', // Bronce/Dorado oscuro
          600: '#b45309',
        },
        // Verde esmeralda extraído de la pluma metálica
        esmeralda: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Verde pluma
          700: '#047857',
        }
      }
    },
  },
  plugins: [],
}