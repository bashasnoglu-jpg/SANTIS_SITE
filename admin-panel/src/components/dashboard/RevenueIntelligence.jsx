import React from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';

/**
 * Sovereign Revenue Intelligence
 * Merkezi SovereignSocket akışından gelen doğrulanmış finansal verileri raporlar.
 */
export default function RevenueIntelligence() {
  const { financeData, radarData } = useSovereignSocket();
  
  // ftrScore'u radarData içinden çekiyoruz (Context'ten)
  const ftrScore = radarData?.ftrIndex || 1.0;
  const financialData = financeData;

  // F_TR 0.98'in altına düşerse sinematik bir uyarı stiline (Adaptive UI) geçiş yapıyoruz
  const isCritical = ftrScore < 0.98;
  const cardBgToken = isCritical ? 'var(--color-surface-glass-dark)' : 'var(--color-surface-elevated)';
  const borderToken = isCritical ? '1px solid var(--color-danger-border)' : '1px solid var(--color-border-subtle)';

  return (
    <div style={{
      marginTop: 'var(--spacing-xl)',
      padding: 'var(--spacing-2xl)',
      backgroundColor: cardBgToken,
      border: borderToken,
      borderRadius: 'var(--radius-xl)',
      backdropFilter: 'blur(var(--blur-lg))',
      transition: 'all var(--duration-slow) var(--ease-lux)'
    }}>
      <h3 style={{ 
        color: 'var(--color-text-primary)', 
        fontFamily: 'var(--font-display)', 
        marginBottom: 'var(--spacing-lg)' 
      }}>
        Canlı Finansal İstihbarat
      </h3>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Aktif Döngü Cirosu</span>
          <p style={{ color: 'var(--color-primary-text)', fontSize: 'var(--text-2xl)', margin: 'var(--spacing-xs) 0 0 0' }}>
            €{financialData.liveRevenue.toLocaleString()}
          </p>
        </div>
        
        <div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Aktif Seanslar</span>
          <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-2xl)', margin: 'var(--spacing-xs) 0 0 0' }}>
            {financialData.activeSessions}
          </p>
        </div>

        {isCritical && (
          <div style={{ borderLeft: '2px solid var(--color-danger-text)', paddingLeft: 'var(--spacing-md)' }}>
             <span style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)' }}>Risk Altındaki Hacim</span>
             <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-xl)', margin: 'var(--spacing-xs) 0 0 0' }}>
               Açıklanabilirlik ihlali nedeniyle finansal akış askıya alınabilir.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
