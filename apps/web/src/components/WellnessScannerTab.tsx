import type { TelemetrySignal } from '@santis/domain-contracts/telemetry';

export const WellnessScannerTab = ({ selfReportedGoals, sessionActive }: { selfReportedGoals: string[], sessionActive: boolean }) => {
  return (
    // Sinematik Negative Space (p-64) ve WebGL Üzeri Konumlandırma (Absolute + Z-Index)
    <div className="absolute inset-0 flex flex-col items-center justify-center p-64 pointer-events-none z-50">
      
      {/* 
        GLASSMORPHISM KURALI UYGULANIYOR: 
        bg-glass + blur-glass + border-soft + soft-float shadow + radius-sm 
      */}
      <div className="pointer-events-auto w-full max-w-[480px] p-32 bg-glass backdrop-blur-glass border border-border-soft rounded-sm shadow-elevation-1 shadow-gold-glow flex flex-col gap-32">
        
        {/* Caption (Eyebrow) Typography + Sovereign Brass */}
        <header className="flex flex-col items-center gap-8 text-center">
          <span className="text-accent-gold text-caption uppercase">
            Sovereign Wellness
          </span>
          <h2 className="text-text-light text-heading-2">
            {sessionActive ? "Biyometrik Senkronizasyon" : "Sistem Beklemede"}
          </h2>
          <p className="text-text-muted text-body-base">
            Sadece kendi beyanınızla şekillenen rafine alan.
          </p>
        </header>

        {/* Card Surface Constraint: İçi boşaltılmış his, Surface Panel */}
        <div className="p-24 bg-surface-panel border border-border-soft rounded-sm">
          <span className="block text-text-muted text-caption uppercase mb-8">
            Kullanıcı Niyeti (Self-Reported)
          </span>
          <div className="text-text-light text-body-large">
            {selfReportedGoals.length ? selfReportedGoals.join(' — ') : "Belirtilmedi"}
          </div>
        </div>

        {/* 
          CTA Button Constraint: 
          Transparent BG, Gold Border, Hover: Muted Gold, Y: 16px, X: 32px 
        */}
        <button className="w-full py-16 px-32 bg-transparent border border-accent-gold text-accent-gold text-caption uppercase rounded-sm hover:bg-accent-gold-muted hover:text-text-light transition-colors duration-500">
          Niyeti Onayla
        </button>
        
      </div>
    </div>
  );
};
