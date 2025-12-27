import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cayenne: {
          50: '#fff1f1',
          100: '#ffdede',
          200: '#ffc0c0',
          300: '#ff9494',
          400: '#ff5a5a',
          500: '#e53e3e',
          600: '#c53030',
          700: '#9b2c2c',
          800: '#822727',
          900: '#63171b'
        },
        neon: {
          50: '#fff0fb',
          100: '#ffd6f3',
          200: '#ffb1e7',
          300: '#ff7dd6',
          400: '#ff45c3',
          500: '#ff1ab5',
          600: '#db0995',
          700: '#b10676',
          800: '#8a065d',
          900: '#5f053f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  }
}

export default config

