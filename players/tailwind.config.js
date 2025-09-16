/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        blockchain: {
          dark: '#1a1b23',
          blue: '#2563eb',
          purple: '#7c3aed',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            'box-shadow': '0 0 15px rgba(59, 130, 246, 0.15)',
          },
          '50%': {
            'box-shadow': '0 0 20px rgba(59, 130, 246, 0.25)',
          },
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.15)',
        'glow-strong': '0 0 20px rgba(59, 130, 246, 0.25)',
      },
      screens: {
        'xs': '380px',
      },
    },
  },
  plugins: [],
}
