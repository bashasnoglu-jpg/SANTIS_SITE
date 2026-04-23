const path = require('path');
const fs = require('fs');

const manifestPath = path.resolve(__dirname, '../packages/design-system/theme-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          dark: manifest.colors['sovereign-dark'],
          surface: manifest.colors['sovereign-surface'],
          gold: manifest.colors['sovereign-gold'],
          text: manifest.colors['sovereign-text'],
          muted: manifest.colors['sovereign-muted'],
          border: manifest.colors['sovereign-border']
        }
      },
      fontFamily: {
        heading: manifest.fontFamily.heading,
        body: manifest.fontFamily.body
      },
      fontSize: manifest.fontSize,
      spacing: manifest.spacing,
      borderRadius: manifest.radius,
      boxShadow: manifest.shadow,
      transitionTimingFunction: manifest.easing
    }
  },
  plugins: []
};
