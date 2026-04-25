import type { Config } from 'tailwindcss';

// --- 1. PRIMITIVE TOKENS (Ham Gerçeklik - Doğrudan UI'a Sızamaz) ---
// Sadece anayasa dosyasının içinde referans amaçlı yaşarlar.
const primitives = {
  gray: {
    50: '#F8F9FA',  // Kırık Beyaz (Light)
    400: '#8E9096', // Dumanlı Gri (Muted)
    700: '#2A2B2F', // Yüzey Rengi
    800: '#1E1F22', // Anthracite
    900: '#101113', // Obsidian
  },
  gold: {
    500: '#D4AF37', // Sovereign Brass
    900: '#1A1507', // Altın Üstü Koyu Metin
  },
  alpha: {
    white08: 'rgba(255, 255, 255, 0.08)',
    gold30: 'rgba(212, 175, 55, 0.3)',
    glass60: 'rgba(30, 31, 34, 0.6)',
    scrim80: 'rgba(16, 17, 19, 0.8)',
  }
};

export const quietLuxuryPreset = {
  content: [],
  theme: {
    // --- 2. SPACING & GRID (8pt Core + 4pt Sub-grid Esnekliği) ---
    spacing: {
      '0': '0px',
      '4': '4px',    // Sub-grid
      '8': '8px',
      '12': '12px',  // Sub-grid
      '16': '16px',
      '20': '20px',  // Sub-grid
      '24': '24px',
      '32': '32px',
      '40': '40px',  // Sub-grid
      '48': '48px',
      '64': '64px',
      '80': '80px',
      '128': '128px',
    },
    
    // --- 3. SEMANTIC COLOR TOKENS (Yüzeylerin İtaat Edeceği Katman) ---
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      
      // Backgrounds
      'bg-primary': primitives.gray[800],
      'bg-cinematic': primitives.gray[900],
      'surface-panel': primitives.gray[700],
      
      // Typography
      'text-primary': primitives.gray[50],
      'text-secondary': primitives.gray[400],
      'text-on-gold': primitives.gray[900], // WCAG 4.5:1 Kontrast Garantisi
      
      // Accents & Borders
      'accent-gold': primitives.gold[500],
      'border-decorative': primitives.alpha.white08,
      
      // Interactive States
      'interactive-hover': primitives.alpha.gold30,
      'interactive-focus-ring': primitives.gold[500],
      'interactive-selected': primitives.alpha.white08,
      'interactive-disabled': primitives.gray[700], 
    },

    // --- 4. TYPOGRAPHY RHYTHM (4pt Baseline'a Tam Bölünen Matematik) ---
    fontFamily: {
      sans: ['Inter', 'SF Pro Display', 'Outfit', 'sans-serif'],
    },
    fontSize: {
      // Değerler: [FontSize, { lineHeight, letterSpacing, fontWeight }]
      // Line-height'lar yüzdelikten çıkarıldı, 4'ün tam katı px'lere sabitlendi.
      'display-1': ['64px', { lineHeight: '72px', letterSpacing: '-0.02em', fontWeight: '400' }], // 72 / 4 = 18
      'heading-1': ['48px', { lineHeight: '56px', letterSpacing: '-0.01em', fontWeight: '500' }], // 56 / 4 = 14
      'heading-2': ['32px', { lineHeight: '40px', letterSpacing: '0em', fontWeight: '500' }],     // 40 / 4 = 10
      'body-large': ['18px', { lineHeight: '28px', letterSpacing: '0em', fontWeight: '400' }],     // 28 / 4 = 7
      'body-base':  ['16px', { lineHeight: '24px', letterSpacing: '0.01em', fontWeight: '400' }],  // 24 / 4 = 6
      'caption':    ['12px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '500' }],  // 16 / 4 = 4
    },

    // --- 5. EFFECTS, ELEVATIONS & SCRIMS ---
    boxShadow: {
      'elevation-1': '0px 8px 32px rgba(0, 0, 0, 0.4)',
      'gold-glow': `inset 0px 0px 150px ${primitives.alpha.gold30}`,
      'none': '0 0 #0000',
    },

    borderRadius: {
      'none': '0px',
      'sm': '2px', // Brutalist-Luxury Soft Edge
    },

    extend: {
      backdropBlur: { 'glass': '16px' },
      backgroundColor: { 'glass': primitives.alpha.glass60 },
      // MEDYA GÜVENLİK VANASI (WCAG Fallback)
      backgroundImage: {
        'overlay-scrim-safe': `linear-gradient(to top, ${primitives.alpha.scrim80} 0%, transparent 100%)`,
      }
    }
  },
  plugins: [],
} satisfies Config;
