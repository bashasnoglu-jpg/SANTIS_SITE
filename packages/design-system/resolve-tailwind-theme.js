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
        border: manifest.colors['sovereign-border'],

        panel: manifest.colors['sovereign-panel'],
        ink: manifest.colors['sovereign-ink'],
        sand: manifest.colors['sovereign-sand'],
        bronze: manifest.colors['sovereign-bronze'],
        accent: manifest.colors['sovereign-accent'],
        earth: manifest.colors['sovereign-earth'],
        black: manifest.colors['sovereign-black']
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
