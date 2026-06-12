module.exports = {
  darkMode: 'class',
  content: [
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          elevated: 'var(--surface-elevated)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        border: {
          DEFAULT: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          accent: 'var(--border-accent)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
          info: 'var(--accent-info)',
        },
        uhub: {
          primary: 'var(--surface-base)',
          secondary: 'var(--surface-raised)',
          tertiary: 'var(--surface-overlay)',
          quaternary: 'var(--surface-elevated)',
          card: 'var(--card-bg)',
          border: 'var(--border-primary)',
          'border-light': 'var(--border-secondary)',
        },
        'uhub-text': {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        'uhub-accent': {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
          info: 'var(--accent-info)',
        },
      },
      backgroundImage: {
        'uhub-gradient': 'var(--gradient-primary)',
        'uhub-gradient-secondary': 'var(--gradient-secondary)',
        'uhub-gradient-accent': 'var(--gradient-accent)',
        'uhub-canvas': 'var(--canvas-gradient)',
      },
      boxShadow: {
        'uhub-sm': 'var(--shadow-sm)',
        'uhub-md': 'var(--shadow-md)',
        'uhub-lg': 'var(--shadow-lg)',
        'uhub-xl': 'var(--shadow-xl)',
        'uhub-glow': 'var(--glow-accent)',
        'uhub-glow-success': 'var(--glow-success)',
        'uhub-glow-danger': 'var(--glow-danger)',
      },
    },
  },
  plugins: [],
};
