(function SantisBoardroomLite() {
  function formatCurrency(value) {
    return `€${Number(value || 0).toLocaleString('en-US')}`;
  }

  function formatTime(ts) {
    if (!ts) return '—';
    try {
      return new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(new Date(ts));
    } catch {
      return '—';
    }
  }

  function renderMetric(label, value, hint = '') {
    return `
      <article class="boardroom-lite-card">
        <span>${label}</span>
        <strong>${value}</strong>
        ${hint ? `<small>${hint}</small>` : ''}
      </article>
    `;
  }

  function render() {
    const root = document.querySelector('[data-boardroom-lite]');
    if (!root || !window.SantisRevenueTracker) return;

    const metrics = window.SantisRevenueTracker.aggregate();
    const recent = metrics.leads.slice(-10).reverse();

    root.innerHTML = `
      <section class="boardroom-lite-hero">
        <p>SANTIS BOARDROOM LITE</p>
        <h1>Revenue Intelligence</h1>
        <span>Public funnel telemetry · Local static mode</span>
      </section>

      <section class="boardroom-lite-grid">
        ${renderMetric('Total Leads', metrics.totalLeads)}
        ${renderMetric('VIP Leads', metrics.vipLeads)}
        ${renderMetric('Priority Leads', metrics.priorityLeads)}
        ${renderMetric('Estimated Revenue', formatCurrency(metrics.estimatedRevenue))}
        ${renderMetric('Avg Lead Value', formatCurrency(metrics.avgLeadValue))}
        ${renderMetric('Avg Guests', metrics.avgGuests)}
        ${renderMetric('Top Ritual', metrics.topRitual)}
        ${renderMetric('Upsell Attach', `${metrics.upsellAttachRate}%`)}
        ${renderMetric('Scarcity Trigger', `${metrics.scarcityTriggerRate}%`)}
        ${renderMetric('Near-Term Demand', `${metrics.nearTermDemandRate}%`)}
      </section>

      <section class="boardroom-lite-panel">
        <div class="boardroom-lite-panel-head">
          <div>
            <p>RECENT HANDOFFS</p>
            <h2>Concierge Revenue Log</h2>
          </div>
          <button type="button" data-boardroom-clear>Clear local log</button>
        </div>

        <div class="boardroom-lite-table">
          ${
            recent.length
              ? recent
                  .map((lead) => {
                    return `
                      <div class="boardroom-lite-row">
                        <strong>${lead.leadTag || '[STANDARD]'}</strong>
                        <span>${lead.ritual || 'Concierge önerisi'}</span>
                        <span>${lead.guests || 1} kişi</span>
                        <span>${lead.upsell || '—'}</span>
                        <span>${formatCurrency(lead.estimatedValue)}</span>
                        <small>${formatTime(lead.ts)}</small>
                      </div>
                    `;
                  })
                  .join('')
              : `<p class="boardroom-lite-empty">Henüz booking handoff kaydı yok.</p>`
          }
        </div>
      </section>
    `;

    root.querySelector('[data-boardroom-clear]')?.addEventListener('click', () => {
      window.SantisRevenueTracker.clear();
      render();
    });
  }

  window.addEventListener('DOMContentLoaded', render);
  window.addEventListener('santis:revenue-event', render);
  window.addEventListener('santis:revenue-cleared', render);

  window.SantisBoardroomLite = { render };
})();
