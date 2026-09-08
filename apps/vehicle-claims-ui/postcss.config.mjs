/**
 * Phase 1: PostCSS configuration.
 *
 * Registers the Tailwind CSS v4 PostCSS plugin so `@import "tailwindcss";`
 * inside app/globals.css expands into the generated utility classes.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
