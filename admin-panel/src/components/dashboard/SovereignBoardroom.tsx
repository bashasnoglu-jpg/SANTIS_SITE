import React, { useEffect } from 'react';
import { useBoardroomReducer } from '../../hooks/useBoardroomReducer';
import { useSovereignWebSocket } from '../../hooks/useSovereignWebSocket';

export function SovereignBoardroom() {
  const { onSocketEvent } = useSovereignWebSocket();
  const [state, dispatch] = useBoardroomReducer();

  useEffect(() => {
    const unsubscribeRevenue = onSocketEvent('boardroom:revenue_tick', (payload) => {
      dispatch({
        type: 'ADD_REVENUE',
        payload,
      });
    });

    const unsubscribeStaff = onSocketEvent('boardroom:staff_status_change', (payload) => {
      dispatch({
        type: 'UPDATE_STAFF',
        payload,
      });
    });

    return () => {
      unsubscribeRevenue?.();
      unsubscribeStaff?.();
    };
  }, [onSocketEvent, dispatch]);

  return (
    <section
      aria-label="Sovereign Boardroom realtime operations"
      style={{
        padding: 'var(--spacing-container-lg)',
        backgroundColor: 'var(--color-surface-primary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-panel)',
        color: 'var(--color-text-primary)',
      }}
    >
      <header style={{ marginBottom: 'var(--spacing-element-lg)' }}>
        <p
          style={{
            margin: '0 0 var(--spacing-element-xs) 0',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-caption)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Live Operations
        </p>
        <h2
          style={{
            margin: 0,
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-heading-lg)',
          }}
        >
          Sovereign Boardroom
        </h2>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-element-md)',
        }}
      >
        <article
          style={{
            padding: 'var(--spacing-container-md)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-panel)',
          }}
        >
          <p
            style={{
              margin: '0 0 var(--spacing-element-xs) 0',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-caption)',
            }}
          >
            Canlı Ciro
          </p>
          <strong
            style={{
              display: 'block',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-display-sm)',
            }}
          >
            €{state.totalRevenue.toLocaleString('tr-TR')}
          </strong>
          {state.lastRevenueTick && (
            <small style={{ color: 'var(--color-text-muted)' }}>
              Son akış: {state.lastRevenueTick.serviceCategory}
            </small>
          )}
        </article>

        <article
          style={{
            padding: 'var(--spacing-container-md)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-panel)',
          }}
        >
          <p
            style={{
              margin: '0 0 var(--spacing-element-xs) 0',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-caption)',
            }}
          >
            Aktif Ritüeller
          </p>
          <strong
            style={{
              display: 'block',
              color: 'var(--color-status-success)',
              fontSize: 'var(--font-size-display-sm)',
            }}
          >
            {state.activeSessions} Terapist
          </strong>
          <small style={{ color: 'var(--color-text-muted)' }}>
            {Object.keys(state.staffStatus).length} terapist izleniyor
          </small>
        </article>
      </div>
    </section>
  );
}
