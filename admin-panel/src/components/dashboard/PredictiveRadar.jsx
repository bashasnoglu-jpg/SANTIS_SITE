import React from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext.js';
import { Radar, Target, TrendingUp } from 'lucide-react';

/**
 * Sovereign Intent Radar
 * Misafirlerin niyet sinyallerini (Intent) ve AI öngörülerini (Prediction) görselleştirir.
 */
export default function PredictiveRadar() {
  const { predictionData } = useSovereignSocket();

  if (!predictionData) return (
    <div style={{
      marginTop: 'var(--spacing-xl)',
      padding: 'var(--spacing-2xl)',
      backgroundColor: 'var(--color-surface-glass)',
      border: '1px solid var(--color-border-glass)',
      borderRadius: 'var(--radius-xl)',
      textAlign: 'center'
    }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        Niyet radarı taranıyor...
      </p>
    </div>
  );

  return (
    <div style={{
      marginTop: 'var(--spacing-xl)',
      padding: 'var(--spacing-2xl)',
      backgroundColor: 'var(--color-surface-glass)',
      border: '1px solid var(--color-border-glass)',
      borderRadius: 'var(--radius-xl)',
      backdropFilter: 'blur(var(--blur-md))',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Arkaplan Radar Animasyonu (CSS) */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        border: '1px solid var(--color-warning-border-subtle)',
        borderRadius: '50%',
        opacity: '0.1',
        animation: 'pulse 4s infinite'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ 
          color: 'var(--color-text-primary)', 
          fontFamily: 'var(--font-display)', 
          fontSize: 'var(--text-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          <Radar size={20} className="text-santis-gold" />
          Predictive Intent Radar
        </h3>
        <span style={{ 
          color: 'var(--color-warning-text)', 
          fontSize: 'var(--text-xs)',
          backgroundColor: 'var(--color-warning-bg-subtle)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)'
        }}>
          LIVE PREDICTION
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', alignItems: 'center' }}>
        {/* Probability Pulse Circle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '2px solid var(--color-warning-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            inset: '-5px',
            borderRadius: '50%',
            border: '1px solid var(--color-warning-text)',
            opacity: '0.3',
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
              {predictionData.probability}
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-[10px])' }}>PROB</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
            <Target size={14} className="text-santis-gold" />
            <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-md)', fontWeight: 'semibold' }}>
              {predictionData.target}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5', margin: 0 }}>
            {predictionData.insight}
          </p>
          <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-success-text)', fontSize: 'var(--text-xs)' }}>
            <TrendingUp size={12} />
            Yüksek Dönüşüm Potansiyeli Tespit Edildi
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: 'var(--spacing-lg)', 
        paddingTop: 'var(--spacing-md)', 
        borderTop: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--text-[10px])',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>GUEST_INTENT_SIGNAL: RECEIVED</span>
        <span>{predictionData.timestamp}</span>
      </div>
    </div>
  );
}
