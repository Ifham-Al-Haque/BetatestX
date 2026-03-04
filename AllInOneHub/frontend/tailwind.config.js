module.exports = {
  darkMode: 'class', // Enable dark mode support
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corevanta theme – white, #083554 (navy), #11278C (accent)
        'hub': {
          'primary': '#083554',        // Navy – main dark
          'secondary': '#0d4268',     // Navy light
          'tertiary': '#124a75',
          'quaternary': '#1a5a8c',
          'card': 'rgba(8, 53, 84, 0.8)',
          'border': 'rgba(255, 255, 255, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.1)',
        },
        'hub-text': {
          'primary': '#ffffff',
          'secondary': 'rgba(255, 255, 255, 0.9)',
          'muted': 'rgba(255, 255, 255, 0.7)',
        },
        'hub-accent': {
          'primary': '#11278C',       // Corevanta accent
          'secondary': '#1a32a8',     // Accent hover
          'success': '#0d9488',
          'warning': '#d97706',
          'danger': '#dc2626',
          'info': '#0891b2',
        }
      },
      backgroundImage: {
        'hub-gradient': 'linear-gradient(135deg, #083554 0%, #11278C 100%)',
        'hub-gradient-secondary': 'linear-gradient(135deg, #11278C 0%, #1a32a8 100%)',
        'hub-gradient-accent': 'linear-gradient(135deg, #083554 0%, #0d4268 50%, #11278C 100%)',
      },
      boxShadow: {
        'hub-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'hub-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'hub-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'hub-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
