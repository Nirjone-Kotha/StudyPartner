import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0866FF',
          dark: '#0056D2',
          tint: '#E7F3FF',
        },
        accent: {
          DEFAULT: '#F3425F',
          tint: '#FEE2E2',
        },
        gold: {
          DEFAULT: '#F7B125',
          tint: '#FEF3C7',
        },
        ink: {
          DEFAULT: '#050505',
          soft: '#65676B',
          faint: '#8A8D91',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F0F2F5',
        },
        bg: '#F0F2F5',
        border: '#E4E6EB',
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 2px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 28px rgba(0, 0, 0, 0.12)',
        brand: '0 4px 14px rgba(8, 102, 255, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
