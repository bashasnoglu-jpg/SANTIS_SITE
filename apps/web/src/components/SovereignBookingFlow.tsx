'use client';

import React from 'react';
// Drizzle anayasamızdan türetilmiş katı tipler (İleride db'den çekilecek)
import type { PackageEntity } from '@santis-core/domain-contracts';

// XState'den (Decision Kernel) gelecek olan Event ve State Sözleşmesi
// UI kendi içinde karar ALAMAZ (useState ile sepet tutmak, fiyat hesaplamak YASAKTIR).
interface SovereignBookingFlowProps {
  currentStep: 'idle' | 'evaluating_package' | 'selecting_slot' | 'payment_hold' | 'human_handoff';
  availablePackages: PackageEntity[];
  selectedPackageId: string | null;
  sendEvent: (event: { type: string; [key: string]: any }) => void;
  isProcessing?: boolean;
}

export const SovereignBookingFlow: React.FC<SovereignBookingFlowProps> = ({
  currentStep,
  availablePackages,
  selectedPackageId,
  sendEvent,
  isProcessing = false
}) => {
  return (
    // 1. Primitive Yasak, Semantic Şart: bg-cinematic (Sinematik İzolasyon Alanı)
    // Makro Ritim: Desktop margin (80px), Padding (128px) -> 8pt grid
    <section className="min-h-screen w-full bg-cinematic flex flex-col items-center justify-start pt-80 pb-128 px-24 relative overflow-hidden selection:bg-interactive-hover selection:text-text-primary">
      
      {/* 2. Medya Güvenlik Vanası (Fallback Scrim) - Arkaya görsel gelirse metin okunabilirliğini %100 garanti eder */}
      <div className="absolute inset-0 bg-overlay-scrim-safe pointer-events-none z-0" />

      {/* Ana İçerik Yüzeyi (Glassmorphism & Elevation) */}
      <div className="relative z-10 w-full max-w-[800px] flex flex-col gap-64">
        
        {/* --- HEADER: Sinematik Tipografi ve Etik Kopya --- */}
        <header className="flex flex-col items-center text-center gap-16 animate-in fade-in duration-1000">
          <span className="text-accent-gold text-caption uppercase tracking-[0.08em]">
            {currentStep === 'human_handoff' ? 'Concierge Müdahalesi' : 'Sovereign Yolculuk'}
          </span>
          <h1 className="text-text-primary text-display-1">
             {currentStep === 'human_handoff' ? 'Lütfen Bekleyin' : 'Ritüel Tasarımı'}
          </h1>
          {/* Manipülatif satış metni yok, etik ve şeffaf yönlendirme var */}
          <p className="text-text-secondary text-body-large max-w-[500px]">
            {currentStep === 'human_handoff' 
              ? 'Sistem otonomisi durduruldu. Özel asistanınız sizinle iletişime geçmek üzere hazırlanıyor.'
              : 'Tıbbi bir dayatma veya zaman baskısı olmaksızın, tamamen anlık fiziksel ve zihinsel niyetinize uygun sekansı belirleyin.'}
          </p>
        </header>

        {/* --- DİNAMİK YÜZEY ALANI --- */}
        {currentStep !== 'human_handoff' && (
          <main className="flex flex-col gap-40">
            
            {/* TİCARİ ÇEKİRDEK (Paket Seçimi) - 4pt Ritmi: gap-24, p-32 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              {availablePackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                
                return (
                  <button
                    key={pkg.id}
                    onClick={() => sendEvent({ type: 'SELECT_PACKAGE', packageId: pkg.id })}
                    disabled={isProcessing}
                    // Görsel Anayasa: Pill yasak (rounded-sm), Yumuşak Işıma, Semantic Renkler
                    className={`
                      group relative flex flex-col items-start text-left p-32 rounded-sm border transition-all duration-500 ease-in-out
                      focus:outline-none focus:ring-1 focus:ring-interactive-focus-ring
                      ${isSelected 
                        ? 'bg-glass backdrop-blur-glass border-accent-gold shadow-gold-glow' 
                        : 'bg-surface-panel border-border-decorative hover:bg-interactive-hover hover:border-accent-gold-muted'
                      }
                      ${isProcessing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex flex-col gap-12 mb-32 w-full">
                      <div className="flex justify-between items-center w-full">
                         <h3 className="text-text-primary text-heading-2 group-hover:text-accent-gold transition-colors duration-500">
                           {pkg.name}
                         </h3>
                         <span className="text-text-secondary text-caption uppercase tracking-widest">
                           {pkg.durationMinutes} Dk
                         </span>
                      </div>
                      <p className="text-text-secondary text-body-base">
                        {pkg.description || "Rafine, yönlendirmesiz ve tamamen bedensel ritminize saygı duyan otonom bir akış."}
                      </p>
                    </div>

                    <div className="mt-auto pt-16 border-t border-border-decorative w-full flex justify-between items-center">
                      <span className="text-text-secondary text-caption uppercase tracking-widest">
                        Şeffaf Bedel
                      </span>
                      {/* Seçiliyken accent-gold vurgusu */}
                      <span className={`text-body-large transition-colors duration-500 ${isSelected ? 'text-accent-gold' : 'text-text-primary'}`}>
                        €{pkg.basePrice}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* --- AKSİYON (Niyeti Mühürleme) --- */}
            <div className={`flex justify-center transition-all duration-700 ${selectedPackageId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <button
                onClick={() => sendEvent({ type: 'CONFIRM_INTENT' })}
                disabled={isProcessing || !selectedPackageId}
                // WCAG 4.5:1 KURALI: Altın zemin üzerine 'text-on-gold' zorunludur. Brutalist-luxury padding.
                className="px-48 py-20 bg-accent-gold text-text-on-gold text-caption uppercase tracking-[0.08em] font-medium rounded-sm shadow-elevation-1 hover:opacity-90 transition-all duration-500 focus:outline-none focus:ring-1 focus:ring-interactive-focus-ring focus:ring-offset-2 focus:ring-offset-bg-cinematic"
              >
                {isProcessing ? 'Senkronize Ediliyor...' : 'Niyeti Mühürle'}
              </button>
            </div>
          </main>
        )}

      </div>
    </section>
  );
};
