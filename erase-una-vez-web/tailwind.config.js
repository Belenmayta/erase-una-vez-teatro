/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'sans-serif'],
        serif: ['Playfair Display', 'Lora', 'Merriweather', 'Libre Baskerville', 'Georgia', 'serif'],
        theater: ['Playfair Display', 'Lora', 'Merriweather', 'Libre Baskerville', 'Georgia', 'serif'],
        slab: ['Arvo', 'Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Paleta oficial "Amethyst dawn haze": #341C67, #472F5B, #C4AEF4, #CCA4B4, #DCCE40
        // Tonos suaves, armoniosos y no muy fuertes
        slate: {
          50: '#F8F6FC',
          100: '#F1ECF9',
          200: '#E3D9F4',
          300: '#C4AEF4', // Lavanda suave (#C4AEF4)
          400: '#CCA4B4', // Malva rosado suave (#CCA4B4)
          500: '#9E85AD',
          600: '#765D8A',
          700: '#583E70',
          800: '#472F5B', // Ciruela humo (#472F5B)
          900: '#341C67', // Amatista profundo principal (#341C67)
          950: '#25134B', // Amatista nocturno suave para barras y contrastes
        },
        teatro: {
          50: '#F7F4FD',
          100: '#EDE7FB',
          200: '#DBCFF8',
          300: '#C4AEF4', // Lavanda suave (#C4AEF4)
          400: '#CCA4B4', // Rosa malva (#CCA4B4)
          500: '#9B7ED9',
          600: '#6A4CA8',
          700: '#472F5B', // Ciruela (#472F5B)
          800: '#3D2462',
          900: '#341C67', // Amatista (#341C67)
          950: '#25134B',
        },
        // Acento dorado suave de la paleta (#DCCE40)
        oro: {
          200: '#F2EC9E',
          300: '#E7DD6B',
          400: '#DCCE40', // Dorado suave Amethyst dawn haze (#DCCE40)
          500: '#C8BA34',
          600: '#A59824',
          700: '#7D721A',
          950: '#382B47',
        },
        // Malva rosado de la paleta (#CCA4B4)
        malva: {
          300: '#DEC2CE',
          400: '#CCA4B4',
          500: '#B5899B',
          600: '#8F6577',
        },
        esmeralda: {
          400: '#6EE7B7',
          500: '#34D399',
          600: '#10B981',
          700: '#059669',
        }
      }
    },
  },
  plugins: [],
}