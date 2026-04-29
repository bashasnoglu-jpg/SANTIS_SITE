(function SantisBoardroomLite() {
  const elements = {
    totalRevenue: document.getElementById('val-total-revenue'),
    totalLeads: document.getElementById('val-total-leads'),
    vipLeads: document.getElementById('val-vip-leads'),
    avgRevenue: document.getElementById('val-avg-revenue'),
    eventLogBody: document.getElementById('event-log-body'),
    emptyState: document.getElementById('empty-state'),
    clearBtn: document.getElementById('btn-clear-data')
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date);
  }

  function renderMetrics(events) {
    let totalRevenue = 0;
    let vipCount = 0;

    events.forEach(evt => {
      totalRevenue += evt.estimatedValue || 0;
      if (evt.leadScore >= 75 || evt.leadTag === '[VIP-LEAD]') {
        vipCount++;
      }
    });

    elements.totalLeads.textContent = events.length;
    elements.vipLeads.textContent = vipCount;
    elements.totalRevenue.textContent = formatCurrency(totalRevenue);
    
    const avg = events.length > 0 ? totalRevenue / events.length : 0;
    elements.avgRevenue.textContent = formatCurrency(avg);
  }

  function getTagClass(tag) {
    if (tag.includes('VIP')) return 'vip';
    if (tag.includes('PRIORITY')) return 'priority';
    return '';
  }

  function renderTable(events) {
    if (events.length === 0) {
      elements.emptyState.hidden = false;
      elements.eventLogBody.innerHTML = '';
      return;
    }

    elements.emptyState.hidden = true;
    
    // Reverse to show newest first
    const sorted = [...events].reverse();

    const html = sorted.map(evt => `
      <tr>
        <td style="color: #888;">${formatDate(evt.timestamp)}</td>
        <td><strong>${evt.ritual}</strong></td>
        <td>${evt.guests}</td>
        <td><span style="color: #bbb;">${evt.upsell || '-'}</span></td>
        <td><span class="tag ${getTagClass(evt.leadTag)}">${evt.leadTag}</span></td>
        <td class="text-right" style="color: var(--boardroom-accent);">${formatCurrency(evt.estimatedValue)}</td>
      </tr>
    `).join('');

    elements.eventLogBody.innerHTML = html;
  }

  function refresh() {
    if (!window.SantisRevenueTracker) {
      console.error('SantisRevenueTracker not found');
      return;
    }

    const events = window.SantisRevenueTracker.getEvents();
    renderMetrics(events);
    renderTable(events);
  }

  // Setup event listeners
  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all pipeline revenue data?')) {
        window.SantisRevenueTracker.clearAll();
        refresh();
      }
    });
  }

  // Listen for real-time updates from other tabs (storage event) or this window (custom event)
  window.addEventListener('storage', (e) => {
    if (e.key === 'santis_revenue_events_v1') {
      refresh();
    }
  });

  window.addEventListener('santis:revenue:tracked', () => {
    refresh();
  });

  // Init
  refresh();
})();
