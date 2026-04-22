/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. RENK TOKEN'LARI (Stash İlkel Paletleri)
      colors: {
        sovereign: {
          dark: '#141416',       // İsli Sıcak Gri (Arka plan)
          brass: '#c6a96b',      // Mat Pirinç (Vurgu)
          muted: '#a1a1aa',      // Pasif metinler
          surface: 'rgba(20, 20, 22, 0.8)' // Yarı saydam yüzeyler
        }
      },
      // 2. TİPOGRAFİ TOKEN'LARI (Majör Üçlü Ölçeği - Major Thirds)
      fontSize: {
        'base': '1rem',        // 16px
        'lg': '1.25rem',       // 20px
        'xl': '1.563rem',      // 25px
        '2xl': '1.953rem',     // 31px
        '3xl': '2.441rem',     // 39px
        '4xl': '3.052rem',     // 48px
      },
      // 3. BOŞLUK VE DÜZEN (8 Noktalı Doğrusal Ölçek)
      spacing: {
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
      },
      // 4. HAREKET TOKEN'LARI (120 FPS Easing)
      transitionTimingFunction: {
        'quiet-luxury': 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    },
  },
  plugins: [],
}
