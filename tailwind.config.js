/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '55': '55',
        '60': '60',
      },
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Naranja Murus (principal)
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        golden: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FBBF24', // Amarillo/Dorado Murus
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        munas: {
          naranja: '#F97316',
          amarillo: '#FBBF24',
          rosa: '#EC4899',
          verde: '#10B981',
          turquesa: '#14B8A6',
          marron: '#92400E',
        },
        ruta: {
          1: '#3b82f6', // Azul
          2: '#ef4444', // Rojo
          3: '#10b981', // Verde
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
