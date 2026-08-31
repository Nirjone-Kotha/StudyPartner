import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5B4DFF',
          dark: '#493BDE',
          tint: '#EEF0FF',
        },
        accent: {
          DEFAULT: '#FF5E3A',
          tint: '#FFF1EE',
        },
        gold: {
          DEFAULT: '#F59E0B',
          tint: '#FEF3C7',
        },
        ink: {
          DEFAULT: '#111827',
          soft: '#4B5563',
          faint: '#9CA3AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8F9FA',
        },
        bg: '#F6F7F9',
        border: '#E5E7EB',
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
        sm: '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        md: '0 6px 20px rgba(15, 23, 42, 0.07), 0 2px 6px rgba(15, 23, 42, 0.04)',
        lg: '0 12px 32px rgba(15, 23, 42, 0.1)',
        brand: '0 4px 14px rgba(91, 77, 255, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
