/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6fa',
          100: '#d9eaf3',
          200: '#b3d4e6',
          300: '#82b8d4',
          400: '#4e97ba',
          500: '#2a7aa5',
          600: '#226a96',
          700: '#1b5e8a',
          800: '#164c70',
          900: '#0f3a57',
        },
        secondary: {
          50: '#effafa',
          100: '#d9eef0',
          200: '#b4dde1',
          300: '#85c7cf',
          400: '#5bb2bd',
          500: '#3a9ea9',
          600: '#2f8590',
          700: '#286b74',
          800: '#23565e',
          900: '#1d464d',
        },
        tertiary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};