const { readManifest } = require('./index');

function resolveTailwindTheme() {
  const manifest = readManifest();

  return {
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
  };
}

module.exports = {
  resolveTailwindTheme
};
