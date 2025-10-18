/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fondo-principal': '#2c3e50',
        'tarjeta': '#34495e',
        'primario': '#E53935',      // Rojo Pasión
        'secundario': '#FFC107',    // Amarillo Victoria
        'confirmacion': '#27ae60',  // Verde Acierto
        'texto-principal': '#ecf0f1',
        'texto-secundario': '#95a5a6',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}