/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "kc-bg": "var(--kc-bg)",
        "kc-ink": "var(--kc-ink)",
        "kc-ink-2": "var(--kc-ink-2)",
        "kc-card": "var(--kc-card)",
        "kc-surface": "var(--kc-surface)",
        "kc-border": "var(--kc-border)",
        "kc-gold-1": "var(--kc-gold-1)",
        "kc-gold-2": "var(--kc-gold-2)",
        "kc-success": "var(--kc-success)",
        "kc-danger": "var(--kc-danger)",
        "kc-grad-gold": "var(--kc-grad-gold)",
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        kc: 'var(--kc-radius)',
        'kc-lg': 'var(--kc-radius-lg)',
        'kc-full': 'var(--kc-radius-full)',
      },
      boxShadow: {
        'kc-sm': 'var(--kc-shadow-sm)',
        'kc-md': 'var(--kc-shadow-md)',
        'kc-inset': 'var(--kc-inset)',
      },
      letterSpacing: {
        'kc-tight': '0.2px',
        'kc-wide': '0.4px',
      },
      transitionTimingFunction: {
        kc: 'var(--kc-ease)',
      },
      transitionDuration: {
        'kc-sm': 'var(--kc-duration-sm)',
        'kc-md': 'var(--kc-duration-md)',
        'kc-lg': 'var(--kc-duration-lg)',
      },
    },
  },
  plugins: [],
};



