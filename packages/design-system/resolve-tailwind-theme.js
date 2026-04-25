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
        black: manifest.colors['sovereign-black'],

        void: manifest.colors['sovereign-void'],
        coal: manifest.colors['sovereign-coal'],
        obsidian: manifest.colors['sovereign-obsidian'],
        line: manifest.colors['sovereign-line'],
        'line-soft': manifest.colors['sovereign-line-soft'],
        'gold-strong': manifest.colors['sovereign-gold-strong'],
        'gold-deep': manifest.colors['sovereign-gold-deep'],
        'gold-pressed': manifest.colors['sovereign-gold-pressed'],
        graphite: manifest.colors['sovereign-graphite'],

        'neutral-200': manifest.colors['sovereign-neutral-200'],
        'neutral-300': manifest.colors['sovereign-neutral-300'],
        'neutral-400': manifest.colors['sovereign-neutral-400'],
        'neutral-500': manifest.colors['sovereign-neutral-500'],
        'neutral-600': manifest.colors['sovereign-neutral-600'],
        'neutral-700': manifest.colors['sovereign-neutral-700'],
        'neutral-800': manifest.colors['sovereign-neutral-800'],
        'neutral-900': manifest.colors['sovereign-neutral-900'],

        danger: manifest.colors['sovereign-danger'],
        success: manifest.colors['sovereign-success'],
        'success-deep': manifest.colors['sovereign-success-deep'],
        warning: manifest.colors['sovereign-warning'],

        signal: {
          stress: manifest.colors['sovereign-signal-stress'],
          hesitation: manifest.colors['sovereign-signal-hesitation'],
          abandon: manifest.colors['sovereign-signal-abandon'],
          therapist: manifest.colors['sovereign-signal-therapist']
        }
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
