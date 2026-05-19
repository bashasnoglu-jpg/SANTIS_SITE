import React from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';

/**
 * Sovereign Strategist's Journal
 * Merkezi SovereignSocket akışından gelen doğrulanmış otonom kararları loglar.
 */
export default function StrategistJournal() {
  const { pricingLogs } = useSovereignSocket();
  const journalLogs = pricingLogs;

  return (
    <div style={{
      marginTop: 'var(--spacing-xl)',
      padding: 'var(--spacing-2xl)',
      backgroundColor: 'var(--color-surface-glass)',
      border: '1px solid var(--color-border-glass)',
      borderRadius: 'var(--radius-xl)',
      backdropFilter: 'blur(var(--blur-md))',
      transition: 'all var(--duration-normal) var(--ease-lux)'
    }}>
      <h3 style={{ 
        color: 'var(--color-text-primary)', 
        fontFamily: 'var(--font-display)', 
        marginBottom: 'var(--spacing-lg)',
        fontSize: 'var(--text-lg)'
      }}>
        Stratejist Günlüğü (AI Audit Trail)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {journalLogs.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
            Otonom kararlar bekleniyor...
          </p>
        ) : (
          journalLogs.map((log) => {
            // Çarpana göre anlamsal (semantic) renk token'ı seçimi
            const isPremium = log.multiplier > 1.0;
            const isDiscount = log.multiplier < 1.0;
            
            let valueToken = 'var(--color-text-primary)';
            if (isPremium) valueToken = 'var(--color-warning-text)';
            if (isDiscount) valueToken = 'var(--color-success-text)';

            return (
              <div key={log.id} style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                paddingBottom: 'var(--spacing-sm)',
                borderBottom: '1px solid var(--color-border-subtle)',
                animation: 'fadeIn var(--duration-normal) var(--ease-lux)'
              }}>
                <div style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)', 
                  minWidth: '70px',
                  paddingTop: 'var(--spacing-xs)'
                }}>
                  {log.timestamp}
                </div>
                <div style={{ flex: 1, marginLeft: 'var(--spacing-md)' }}>
                  <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {log.reason}
                  </p>
                  <span style={{ color: valueToken, fontSize: 'var(--text-xs)' }}>
                    Fiyat Çarpanı: {log.multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
