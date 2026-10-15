/** @type {import('tailwindcss').Config} */
// As escalas abaixo remapeiam as cores usadas nos templates (renderers-*.js)
// para a paleta do design system (tokens em assets/css/styles.css, :root).
// Assim um `text-zinc-500` existente já sai como `--tinta-apagada`, sem
// reescrever cada template. Mantenha os hex em sincronia com o :root.
module.exports = {
  content: [
    './index.html',
    './aventura.html',
    './callback.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // Neutros grafite: 950 fundo · 900 painel · 800 borda · 100 tinta
        zinc: {
          50: '#f5f4f1',
          100: '#ecebe7',
          200: '#dddcd7',
          300: '#cfcec9',
          400: '#b9b8b3',
          500: '#8f8f8b',
          600: '#6e6f73',
          700: '#4a4c52',
          800: '#34363b',
          900: '#1a1b1e',
          950: '#111214',
        },
        // Ouro: a única cor de ação (400 = --ouro)
        amber: {
          200: '#f3d9a4',
          300: '#ebc06e',
          400: '#e3a93f',
          500: '#d0942a',
          600: '#a8731b',
          700: '#7d5512',
        },
        // Segredo
        rose: { 300: '#dc9cc4', 400: '#d088b6', 500: '#c0729f' },
        // Arcano: disponível, conexões, interação
        sky: { 300: '#93b6e2', 400: '#7fa6d8', 500: '#5d88c0' },
        // Musgo: concluído, localização, cura
        emerald: { 300: '#a3c880', 400: '#93bb6e', 500: '#7aa255' },
      },
      fontFamily: {
        sans: ['"Alegreya Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        livro: ['Alegreya', 'Georgia', '"Times New Roman"', 'serif'],
        rubrica: ['"Alegreya SC"', 'Alegreya', 'Georgia', 'serif'],
        rotulo: ['"Alegreya Sans SC"', '"Alegreya Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
