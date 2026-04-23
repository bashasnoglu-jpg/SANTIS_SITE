import type { Config } from 'tailwindcss';
import { quietLuxuryPreset } from '@santis/ui-tokens';

export default {
  presets: [quietLuxuryPreset], // Sovereign Görsel Manifestosu Mühürlendi
  content: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
} satisfies Config;
