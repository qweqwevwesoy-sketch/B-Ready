/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#28599a',
        'primary-light': '#4a7bc1',
        'primary-dark': '#1e4373',
        success: '#2ecc71',
        danger: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        'custom-yellow': {
          500: '#e8cc5b',
          600: '#f7bf25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
