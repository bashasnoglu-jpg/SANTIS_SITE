import React from 'react';

export default function GhostDrawer({ isOpen, onClose, anomalies }) {
  return (
    <>
      {/* Drawer açıkken arkayı hafifçe karartan Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'var(--cinematic-easing)', zIndex: 999
        }}
      />

      <div className={`ghost-drawer ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ color: 'var(--nv-brushed-gold)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 400, margin: 0 }}>
            Hayalet Operasyonlar
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--nv-text-muted)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.3s' }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {anomalies.length === 0 ? (
            <p style={{ color: 'var(--nv-text-muted)', fontSize: '0.9rem', fontWeight: 300, fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
              Optimal akış. Kayıtlı operasyon yok.
            </p>
          ) : (
            // DOM Throttle: Sadece son 20 otonom müdahaleyi (sondan başa) göster
            [...anomalies].reverse().slice(0, 20).map((anomaly, idx) => {
              const isCritical = anomaly.riskDelta > 0.5;
              const isLead = anomaly.status === "vip_lead";
              
              let borderColor = 'rgba(142, 144, 150, 0.2)';
              let bgColor = 'transparent';
              let textColor = 'var(--nv-text-muted)';
              let opacity = 0.4;
              let highlightColor = 'inherit';
              let textWeight = 300;

              if (isLead) {
                borderColor = '#50C878'; // Zümrüt Yeşili
                bgColor = 'rgba(80, 200, 120, 0.05)';
                textColor = 'var(--nv-text-light)';
                opacity = 1;
                highlightColor = '#50C878';
                textWeight = 500;
              } else if (isCritical) {
                borderColor = 'var(--nv-brushed-gold)';
                bgColor = 'rgba(212, 175, 55, 0.05)';
                textColor = 'var(--nv-text-light)';
                opacity = 1;
                highlightColor = 'var(--nv-brushed-gold)';
                textWeight = 500;
              }

              return (
                <div key={idx} className="animate-fade-in" style={{
                  background: bgColor,
                  padding: '1.2rem', 
                  borderRadius: '4px',
                  borderLeft: `2px solid ${borderColor}`,
                  opacity: opacity,
                  animationDelay: `${idx * 50}ms`,
                  transition: 'opacity 0.3s ease, background 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--nv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <span>{new Date(anomaly.timestamp).toLocaleTimeString()}</span>
                    <span style={{ color: highlightColor, fontWeight: textWeight }}>
                      {isLead ? `VIP Lead (Sepet: ${anomaly.cartSize || 0})` : `Δ ${Number(anomaly.riskDelta).toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ color: textColor, fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.6 }}>
                    {anomaly.message || anomaly.status || "Otonom müdahale tamamlandı."}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
