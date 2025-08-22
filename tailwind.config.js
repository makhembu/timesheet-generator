/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",    // App Router pages/layouts
    "./components/**/*.{js,ts,jsx,tsx}", // Your components
    "./src/**/*.{js,ts,jsx,tsx,mdx}",    // (if you use src/ folder)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
