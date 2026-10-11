/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'monospace'],
      },
      colors: {
        'bg-main': '#05070A',
        'bg-secondary': '#090D13',
        surface: '#0D131C',
        'surface-raised': '#121A25',
        'surface-overlay': '#171E29',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        'surface-border-strong': 'rgba(255, 255, 255, 0.14)',
        
        background: '#05070A',
        'surface-elevated': '#121A25',

        content: '#F5F7FA',
        'content-muted': '#9BA7B4',
        'content-subtle': '#5F6B78',

        // Brand accents
        cyan: {
          DEFAULT: '#63E6FF',
          glow: '#56E0FF',
          dark: '#0e7490',
        },
        violet: {
          DEFAULT: '#8B7CFF',
          glow: '#7C6CFF',
          dark: '#581c87',
        },
        primary: {
          DEFAULT: '#63E6FF',
          hover: '#56E0FF',
        },
        secondary: {
          DEFAULT: '#8B7CFF',
          hover: '#7C6CFF',
        },
        
        // Semantic severities
        critical: {
          DEFAULT: '#FF5D67',
          light: '#FFA3A8',
          bg: 'rgba(255, 93, 103, 0.12)',
        },
        high: {
          DEFAULT: '#FF944D',
          light: '#FFC49E',
          bg: 'rgba(255, 148, 77, 0.12)',
        },
        medium: {
          DEFAULT: '#FFB84D',
          light: '#FFE099',
          bg: 'rgba(255, 184, 77, 0.12)',
        },
        low: {
          DEFAULT: '#56E0FF',
          light: '#A6F2FF',
          bg: 'rgba(86, 224, 255, 0.12)',
        },
        
        // Semantic states
        success: {
          DEFAULT: '#38D996',
          bg: 'rgba(56, 217, 150, 0.12)',
        },
        warning: {
          DEFAULT: '#FFB84D',
          bg: 'rgba(255, 184, 77, 0.12)',
        },
        danger: {
          DEFAULT: '#FF5D67',
          bg: 'rgba(255, 93, 103, 0.12)',
        },
        info: {
          DEFAULT: '#56E0FF',
          bg: 'rgba(86, 224, 255, 0.12)',
        },
        
        brand: {
          DEFAULT: '#63E6FF',
          hover: '#56E0FF',
        }
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        elevated: '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        cyanGlow: '0 0 25px rgba(99, 230, 255, 0.25)',
        violetGlow: '0 0 25px rgba(139, 124, 255, 0.25)',
      },
      animation: {
        'scan-beam': 'scanBeam 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'border-spin': 'borderSpin 4s linear infinite',
      },
      keyframes: {
        scanBeam: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        borderSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
