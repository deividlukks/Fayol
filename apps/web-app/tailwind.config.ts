import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          dark: '#1d4ed8', // blue-700
          light: '#60a5fa', // blue-400
        },
        secondary: '#64748b', // slate-500
        success: '#10b981', // emerald-500
        danger: '#ef4444', // red-500
        warning: '#f59e0b', // amber-500
        background: '#f8fafc', // slate-50
        surface: '#ffffff',
      },
    },
  },
  plugins: [],
};
export default config;
