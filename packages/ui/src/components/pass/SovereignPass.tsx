import React from 'react';
import { SovereignButton } from '../button/SovereignButton';

export interface SovereignPassProps {
  passId: string;
  holderName: string;
  ritualTitle: string;
  date: string;
  qrValue: string; // Kriptografik mühür verisi
  onConciergeConnect: () => void;
}

export const SovereignPass: React.FC<SovereignPassProps> = ({
  passId,
  holderName,
  ritualTitle,
  date,
  qrValue,
  onConciergeConnect
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-slide-in-bottom">
      {/* Sovereign Pass Gövdesi (Apple Wallet Estetiği) */}
      <div className="w-full bg-[#0a0a0b] border border-[#c6a96b]/30 rounded-2xl overflow-hidden shadow-2xl shadow-[#c6a96b]/5">
        
        {/* Üst Kısım: Logo ve Pass ID */}
        <div className="p-6 border-b border-[#c6a96b]/10 flex justify-between items-center bg-gradient-to-b from-[#141416] to-[#0a0a0b]">
          <span className="text-[#c6a96b] font-serif tracking-[0.3em] text-xs uppercase">Sovereign OS</span>
          <span className="text-[#8e8e93] font-mono text-[10px] uppercase opacity-50">#{passId}</span>
        </div>

        {/* Orta Kısım: Misafir ve Ritüel Bilgisi */}
        <div className="p-8 space-y-8 text-center">
          <div>
            <p className="text-[#8e8e93] text-[10px] uppercase tracking-widest mb-2">Mühür Sahibi</p>
            <h2 className="text-[#e5e5ea] font-light text-2xl font-serif tracking-wide">{holderName}</h2>
          </div>
          
          <div className="py-6 border-y border-[#c6a96b]/5">
            <p className="text-[#c6a96b] text-[10px] uppercase tracking-widest mb-2">Onaylanan Ritüel</p>
            <h3 className="text-[#e5e5ea] text-lg font-light">{ritualTitle}</h3>
            <p className="text-[#8e8e93] font-mono text-xs mt-2">{date}</p>
          </div>

          {/* Kriptografik QR Mühür Çerçevesi */}
          <div className="relative inline-block p-3 bg-white/[0.03] border border-[#c6a96b]/20 rounded-xl">
             <div className="w-40 h-40 flex items-center justify-center bg-white rounded-lg p-2">
                {/* Buraya gerçek bir QR Generator bileşeni gelecek */}
                <div className="w-full h-full bg-[#0a0a0b] flex items-center justify-center border border-dashed border-[#c6a96b]/30">
                   <span className="text-[#c6a96b] font-mono text-[8px] text-center px-2">ENCRYPTED SOVEREIGN CORE</span>
                </div>
             </div>
             {/* Köşe Süslemeleri */}
             <div className="absolute -top-1 -left-1 w-4 h-4 border-t border-l border-[#c6a96b]" />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b border-r border-[#c6a96b]" />
          </div>
        </div>

        {/* Alt Kısım: Durum Mesajı */}
        <div className="p-4 bg-[#c6a96b]/5 text-center">
          <p className="text-[#c6a96b] text-[9px] uppercase tracking-[0.2em]">Kriptografik Olarak Mühürlenmiştir</p>
        </div>
      </div>

      {/* Concierge Köprüsü (Hemen Altında Fısıldar) */}
      <div className="mt-10 text-center space-y-6 animate-fade-in-delayed">
        <p className="text-[#8e8e93] text-sm font-light italic leading-relaxed">
          "Sovereign Pass'iniz mühürlendi. Özel elçiniz detaylar için <br/>
          güvenli hat üzerinden sizi bekliyor..."
        </p>
        <SovereignButton 
          label="ÖZEL ELÇİYE BAĞLAN" 
          variant="primary" 
          size="lg" 
          onClick={onConciergeConnect}
          className="w-full"
        />
      </div>
    </div>
  );
};
