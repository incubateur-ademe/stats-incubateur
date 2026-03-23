/** Minimal PostCSS config kept intentionally simple so TypeScript/ESLint skip type-project resolution. */
const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

export default postcssConfig;
