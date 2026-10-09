import path from "node:path";

// Turbopack evaluates PostCSS plugins from its build directory, so a local
// plugin must be resolved to an absolute path before it is handed to PostCSS.
const config = {
  plugins: {
    // Order the component utilities before Next.js performs CSS minification.
    "@tailwindcss/postcss": { optimize: false },
    [path.resolve(process.cwd(), "scripts/component-cascade.cjs")]: {},
  },
};
export default config;
