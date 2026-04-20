import React, { useState, useEffect } from 'react';

/**
 * SantisDynamicOffer: Kişiselleştirilmiş Satış Kapanış Bileşeni
 * @param {number} stressLevel - Kiosk'tan gelen % bazlı stres verisi
 */
const SantisDynamicOffer = ({ stressLevel }) => {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Teklif Mantığı
    const getOfferDetails = (level) => {
        if (level >= 80) return {
            risk: "KRİTİK JİTTER SAPMASI",
            module: "Parasempatik Koruma Modülü",
            reason: "Vokal tellerinizdeki mikroskobik titremeler, otonom sinir sisteminizde aşırı yüklenme sinyali veriyor."
        };
        if (level >= 60) return {
            risk: "ORTA DÜZEY KORTİZOL YÜKÜ",
            module: "Adrenal Dengeleyici Paket",
            reason: "Analiz sonuçlarınız, sistemik stres seviyenizin eşik değerinde olduğunu gösteriyor."
        };
        return {
            risk: "PREVENTİF OPTİMİZASYON",
            module: "Proaktif Uzun Ömür Takviyesi",
            reason: "Sisteminiz stabil ancak hücresel yenilenme hızınızın artırılması öneriliyor."
        };
    };

    const offer = getOfferDetails(stressLevel);
    const fullText = `SİSTEM LOGU: Vokal Kuantum Taramanızda %${stressLevel} ${offer.risk} tespit edilmiştir. ${offer.reason} Kritik seviyedeki riskiniz sebebiyle, size tahsis edilen Sovereign Choice planınıza '${offer.module}' ücretsiz eklendi.`;

    // Typewriter Efekti
    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setDisplayText((prev) => prev + fullText.charAt(index));
            index++;
            if (index >= fullText.length) {
                clearInterval(timer);
                setIsComplete(true);
            }
        }, 30); // Yazma hızı (ms)

        return () => clearInterval(timer);
    }, [stressLevel]);

    return (
        <div className="bg-[#1c1c1f] border border-[#c6a96b]/30 p-6 font-mono text-xs md:text-sm">
            <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-[#c6a96b] tracking-widest uppercase">Kuantum Analiz Raporu</span>
            </div>

            <div className="text-zinc-300 leading-relaxed min-h-[100px] mb-6">
                {displayText}
                <span className="animate-ping">|</span>
            </div>

            {isComplete && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="bg-[#c6a96b]/10 border border-[#c6a96b]/50 p-4 mb-6">
                        <span className="text-[#c6a96b] block font-bold mb-1">HEDİYE TANIMLANDI:</span>
                        <span className="text-white uppercase tracking-tighter">{offer.module}</span>
                    </div>

                    <button className="w-full bg-[#c6a96b] text-black font-bold py-4 tracking-[0.2em] uppercase hover:bg-[#d4bc8d] transition-colors shadow-[0_0_20px_rgba(198,169,107,0.3)]">
                        Analizi Onayla ve Planı Mühürle
                    </button>
                </div>
            )}
        </div>
    );
};

export default SantisDynamicOffer;
