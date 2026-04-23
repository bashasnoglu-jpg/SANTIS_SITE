const { resolveTailwindTheme } = require('../packages/design-system/resolve-tailwind-theme');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: resolveTailwindTheme()
  },
  plugins: []
};
