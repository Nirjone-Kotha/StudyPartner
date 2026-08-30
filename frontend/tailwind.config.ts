import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6C4CFA',
          dark: '#5636E0',
          tint: '#EFEAFE',
        },
        accent: {
          DEFAULT: '#FF6B4A',
          tint: '#FFE7E0',
        },
        gold: {
          DEFAULT: '#FFC93C',
          tint: '#FFF6DC',
        },
        ink: {
          DEFAULT: '#1C1830',
          soft: '#6E698A',
          faint: '#A7A2C0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#FBF9FF',
        },
        bg: '#F5F3FC',
        border: '#E8E4F7',
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(28,24,48,0.06), 0 1px 2px rgba(28,24,48,0.04)',
        md: '0 8px 24px rgba(28,24,48,0.08)',
        lg: '0 16px 40px rgba(28,24,48,0.14)',
        brand: '0 4px 14px rgba(108,76,250,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
