function chartColorVar(tokenName, fallback) {
  return `var(${tokenName}${fallback ? `, ${fallback}` : ''})`;
}

const chartTheme = {
  surface: chartColorVar('--sovereign-surface', '#202024'),
  panel: chartColorVar('--sovereign-panel', '#2A2624'),
  dark: chartColorVar('--sovereign-dark', '#141416'),
  obsidian: chartColorVar('--sovereign-obsidian', '#1A1817'),

  primary: chartColorVar('--sovereign-gold', '#c6a96b'),
  primaryStrong: chartColorVar('--sovereign-gold-strong', '#D4AF37'),
  primaryDeep: chartColorVar('--sovereign-gold-deep', '#C5A059'),
  primaryPressed: chartColorVar('--sovereign-gold-pressed', '#B5952F'),

  ink: chartColorVar('--sovereign-ink', '#E5E0D8'),
  text: chartColorVar('--sovereign-text', '#d6d6d8'),
  muted: chartColorVar('--sovereign-muted', '#8f9095'),

  neutral200: chartColorVar('--sovereign-neutral-200', '#e5e5e5'),
  neutral300: chartColorVar('--sovereign-neutral-300', '#dddddd'),
  neutral400: chartColorVar('--sovereign-neutral-400', '#cccccc'),
  neutral500: chartColorVar('--sovereign-neutral-500', '#a3a3a3'),
  neutral600: chartColorVar('--sovereign-neutral-600', '#666666'),
  neutral700: chartColorVar('--sovereign-neutral-700', '#444444'),
  neutral800: chartColorVar('--sovereign-neutral-800', '#404040'),
  neutral900: chartColorVar('--sovereign-neutral-900', '#262626'),

  success: chartColorVar('--sovereign-success', '#10b981'),
  successDeep: chartColorVar('--sovereign-success-deep', '#059669'),
  warning: chartColorVar('--sovereign-warning', '#d97706'),
  danger: chartColorVar('--sovereign-danger', '#ff3b30'),

  grid: chartColorVar('--sovereign-neutral-800', '#404040'),
  axis: chartColorVar('--sovereign-neutral-500', '#a3a3a3'),
  tooltipBg: chartColorVar('--sovereign-neutral-900', '#262626'),
  tooltipBorder: chartColorVar('--sovereign-neutral-800', '#404040'),
  tooltipText: chartColorVar('--sovereign-neutral-200', '#e5e5e5')
};

module.exports = {
  chartTheme
};
