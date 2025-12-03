/** Minimal PostCSS config kept intentionally simple so TypeScript/ESLint skip type-project resolution. */
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
