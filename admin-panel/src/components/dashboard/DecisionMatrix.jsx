import React from 'react';

/**
 * Sovereign Decision Matrix
 * F_TR metriklerine göre otonom açıklanabilir kararlar üretir.
 * 
 * @param {number} ftrScore - Truth Layer'from gelen güncel gerçeklik indeksi
 */
export default function DecisionMatrix({ ftrScore }) {
  
  // F_TR Skoruna göre sistem durumunu ve kararını hesaplayan deterministik fonksiyon
  const evaluateSystemReality = (score) => {
    if (score >= 1.0) {
      return {
        status: "Sovereign Guard Aktif",
        action: "Sistem stabil. Ekstra müdahale gerekmiyor.",
        colorToken: "var(--color-success-text)",
        bgToken: "var(--color-success-bg-subtle)"
      };
    } else if (score >= 0.98) {
      return {
        status: "Gözlem Modu",
        action: "Veri tutarlılığında hafif dalgalanma. Kayıtları incelemeye al.",
        colorToken: "var(--color-warning-text)",
        bgToken: "var(--color-warning-bg-subtle)"
      };
    } else {
      return {
        status: "Gerçeklik Kilidi (Reality Lock) İhlali",
        action: "Açıklanabilirlik Derinliği (Explanation Depth) kritik seviyede. Sistemi güvenli moda al.",
        colorToken: "var(--color-danger-text)",
        bgToken: "var(--color-danger-bg-subtle)"
      };
    }
  };

  const decision = evaluateSystemReality(ftrScore);

  return (
    <div style={{
      marginTop: 'var(--spacing-xl)',
      padding: 'var(--spacing-lg)',
      backgroundColor: decision.bgToken,
      border: `1px solid ${decision.colorToken}`,
      borderRadius: 'var(--radius-lg)',
      transition: 'all var(--duration-normal) var(--ease-lux)'
    }}>
      <h3 style={{ 
        color: decision.colorToken, 
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        marginBottom: 'var(--spacing-sm)' 
      }}>
        Karar Matrisi: {decision.status}
      </h3>
      <p style={{ 
        color: 'var(--color-text-secondary)', 
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-base)',
        margin: 0 
      }}>
        <strong>Önerilen Aksiyon:</strong> {decision.action}
      </p>
    </div>
  );
}
