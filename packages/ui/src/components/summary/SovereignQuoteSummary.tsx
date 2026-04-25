import React from 'react';
import { SovereignButton } from '../button/SovereignButton';

export interface UpsellItem {
  id: string;
  title: string;
  price: number;
  isSelected: boolean;
}

export interface SovereignQuoteSummaryProps {
  ritualTitle: string;
  ritualPrice: number;
  upsells?: UpsellItem[];
  onToggleUpsell?: (id: string) => void;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

export const SovereignQuoteSummary: React.FC<SovereignQuoteSummaryProps> = ({
  ritualTitle,
  ritualPrice,
  upsells = [],
  onToggleUpsell,
  onConfirm,
  isConfirming = false
}) => {
  // Toplam tutarı otonom hesaplama
  const totalUpsellPrice = upsells.filter(u => u.isSelected).reduce((acc, curr) => acc + curr.price, 0);
  const grandTotal = ritualPrice + totalUpsellPrice;

  return (
    <div className="bg-[#141416] border border-[#2A2B2E] p-8 rounded-md animate-in slide-in-from-bottom-4 duration-500 w-full text-left">
      <h4 className="text-[#8e8e93] text-xs uppercase tracking-widest mb-6 border-b border-[#2A2B2E] pb-2">
        Rezervasyon Özeti
      </h4>
      
      {/* Seçilen Ana Ritüel */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[#e5e5ea] font-serif text-lg tracking-wide">{ritualTitle}</span>
        <span className="text-[#c6a96b] font-mono">€{ritualPrice.toLocaleString('en-US')}</span>
      </div>

      {/* V-Commerce Up-sell Alanı */}
      {upsells.length > 0 && (
        <div className="mt-6 mb-6">
          <h5 className="text-[#8e8e93] text-[10px] uppercase tracking-widest mb-3">
            Sovereign Eklentileri (Opsiyonel)
          </h5>
          <div className="space-y-3">
            {upsells.map(upsell => (
              <div 
                key={upsell.id}
                onClick={() => onToggleUpsell && onToggleUpsell(upsell.id)}
                className={`flex justify-between items-center p-3 rounded cursor-pointer transition-all duration-300 border ${
                  upsell.isSelected ? 'border-[#c6a96b] bg-[#c6a96b]/5' : 'border-[#333333] hover:border-[#8e8e93]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full border ${upsell.isSelected ? 'bg-[#c6a96b] border-[#c6a96b]' : 'border-[#8e8e93]'}`} />
                  <span className={`text-sm ${upsell.isSelected ? 'text-[#c6a96b]' : 'text-[#8e8e93]'}`}>{upsell.title}</span>
                </div>
                <span className="text-[#8e8e93] font-mono text-xs">+€{upsell.price.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toplam ve Onay */}
      <div className="mt-8 pt-6 border-t border-[#2A2B2E] flex justify-between items-end flex-wrap gap-4">
        <div>
          <span className="block text-[#8e8e93] text-xs tracking-widest uppercase mb-1">Toplam Yatırım</span>
          <span className="text-2xl text-[#c6a96b] font-mono tracking-widest">€{grandTotal.toLocaleString('en-US')}</span>
        </div>
        <SovereignButton 
          label={isConfirming ? "ONAYLANIYOR..." : "NİYETİ ONAYLA"} 
          variant="primary" 
          size="lg" 
          onClick={onConfirm} 
          disabled={isConfirming}
        />
      </div>
    </div>
  );
};
