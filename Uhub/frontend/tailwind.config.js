module.exports = {
  darkMode: 'class', // Enable dark mode support
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark blue theme colors matching the dashboard screenshot
        'uhub': {
          'primary': '#0f1419',        // Main dark blue background
          'secondary': '#1a1f2e',      // Lighter dark blue
          'tertiary': '#242938',       // Even lighter blue
          'quaternary': '#2e3442',     // Lightest blue
          'card': 'rgba(26, 31, 46, 0.7)',  // Translucent card background
          'border': 'rgba(255, 255, 255, 0.2)',  // Translucent white border
          'border-light': 'rgba(255, 255, 255, 0.1)',  // Lighter translucent border
        },
        // Text colors
        'uhub-text': {
          'primary': '#ffffff',        // Pure white
          'secondary': '#e2e8f0',      // Light gray
          'muted': '#94a3b8',          // Muted gray
        },
        // Accent colors
        'uhub-accent': {
          'primary': '#3b82f6',        // Blue
          'secondary': '#6366f1',      // Indigo
          'success': '#10b981',        // Emerald
          'warning': '#f59e0b',        // Amber
          'danger': '#ef4444',         // Red
          'info': '#06b6d4',           // Cyan
        }
      },
      backgroundImage: {
        // Custom gradients matching the theme
        'uhub-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        'uhub-gradient-secondary': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        'uhub-gradient-accent': 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      },
      boxShadow: {
        // Custom shadows for the dark theme
        'uhub-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'uhub-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'uhub-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'uhub-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
