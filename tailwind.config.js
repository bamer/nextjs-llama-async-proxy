 const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#a5b4fc', // indigo-300 for softer look
          DEFAULT: '#6366f1', // indigo-500
          dark: '#4338ca', // indigo-700
        },
        secondary: {
          light: '#67e8f9', // cyan-300
          DEFAULT: '#06b6d4', // cyan-500
          dark: '#0891b2', // cyan-700
        },
        accent: {
          light: '#f0abfc', // fuchsia-300
          DEFAULT: '#d946ef', // fuchsia-500
          dark: '#a21caf', // fuchsia-700
        },
        gray: {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '800': '#1f2937',
          '900': '#111827',
          '950': '#030712',
        },
        success: {
          DEFAULT: '#10b981', // green-500
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
        },
        danger: {
          DEFAULT: '#dc2626', // red-600 (more distinct from accent)
        },
        primary_foreground: {
          DEFAULT: '#ffffff', // white for primary background
        },
        card: {
          DEFAULT: '#ffffff', // white for card background in light mode
          dark: '#111827', // gray-900 for dark mode
        },
        layout: {
          DEFAULT: '#f9fafb', // gray-50 for layout background in light mode
          dark: '#111827', // gray-900 for dark mode
        },
        border: {
          DEFAULT: '#e5e7eb', // gray-200 for border in light mode
          dark: '#374151', // gray-700 for dark mode
        },
        input: {
          DEFAULT: '#ffffff', // white for input background in light mode
          dark: '#1f2937', // gray-800 for dark mode
        },
        ring: {
          DEFAULT: '#3b82f6', // primary color for ring focus
        },
        foreground: {
          DEFAULT: '#111827', // dark gray for foreground text in light mode
          dark: '#f9fafb', // gray-50 for dark mode
        },
        'muted-foreground': {
          DEFAULT: '#6b7280', // gray-500 for muted text in light mode
          dark: '#9ca3af', // gray-400 for dark mode
        },
        background: {
          DEFAULT: '#ffffff', // white for background in light mode
          dark: '#111827', // gray-900 for dark mode
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...fontFamily.mono],
      },
    },
  },
  plugins: [],
};