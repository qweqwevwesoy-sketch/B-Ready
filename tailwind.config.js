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
          500: '#ffbd52',
          600: '#f7c472',
          100: 'rgba(255, 229, 163, 0.6)',
        },
      },
      backgroundImage: {
        'custom-yellow-gradient': 'radial-gradient(circle at center, rgba(249, 219, 145, 0.15) 0%, rgba(249, 219, 145, 0.05) 50%, rgba(249, 219, 145, 0) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
