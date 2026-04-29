(function SantisBoardroomLite() {
  const elements = {
    totalRevenue: document.getElementById('val-total-revenue'),
    totalLeads: document.getElementById('val-total-leads'),
    vipLeads: document.getElementById('val-vip-leads'),
    avgRevenue: document.getElementById('val-avg-revenue'),
    eventLogBody: document.getElementById('event-log-body'),
    emptyState: document.getElementById('empty-state'),
    clearBtn: document.getElementById('btn-clear-data'),
    oracleContainer: document.getElementById('oracle-insights-container'),
    vipList: document.getElementById('vip-segment-list')
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

  function renderVIPSegment(events) {
    if (!elements.vipList) return;
    const vipEvents = events.filter(evt => evt.leadScore >= 75 || evt.leadTag === '[VIP-LEAD]');
    
    if (vipEvents.length === 0) {
      elements.vipList.innerHTML = '<div class="empty-state">No VIP leads detected yet.</div>';
      return;
    }

    const sortedVip = [...vipEvents].reverse();
    const html = sortedVip.slice(0, 5).map(evt => `
      <div class="vip-card">
        <div class="vip-info">
          <span class="vip-ritual">${evt.ritual}</span>
          <span class="vip-meta">${formatDate(evt.timestamp)} • ${evt.guests} Guests</span>
        </div>
        <div class="vip-value">${formatCurrency(evt.estimatedValue)}</div>
      </div>
    `).join('');

    elements.vipList.innerHTML = html;
  }

  function renderOracleInsights(events) {
    if (!elements.oracleContainer) return;
    
    if (events.length === 0) {
      elements.oracleContainer.innerHTML = '<div class="oracle-message empty">Awaiting data to generate insights...</div>';
      return;
    }

    const insights = [];
    let totalRevenue = 0;
    const ritualCounts = {};
    let upsellCount = 0;

    events.forEach(evt => {
      totalRevenue += evt.estimatedValue || 0;
      ritualCounts[evt.ritual] = (ritualCounts[evt.ritual] || 0) + 1;
      if (evt.upsell && evt.upsell !== 'None') upsellCount++;
    });

    // Insight 1: Most popular ritual
    const topRitual = Object.keys(ritualCounts).reduce((a, b) => ritualCounts[a] > ritualCounts[b] ? a : b);
    insights.push(`<strong>Demand Shift:</strong> "${topRitual}" is currently the highest converting intent with ${ritualCounts[topRitual]} handoffs.`);

    // Insight 2: Upsell conversion
    const upsellRate = Math.round((upsellCount / events.length) * 100);
    if (upsellRate > 30) {
      insights.push(`<strong>Upsell Efficiency:</strong> Upsell attachment rate is strong at ${upsellRate}%. Consider introducing a secondary premium tier.`);
    } else if (events.length >= 3) {
      insights.push(`<strong>Revenue Opportunity:</strong> Upsell rate is ${upsellRate}%. Try increasing urgency or scarcity signals in the funnel.`);
    }

    // Insight 3: High Value Alert
    const avgValue = totalRevenue / events.length;
    if (avgValue > 500) {
      insights.push(`<strong>VIP Momentum:</strong> Average lead value is extremely high (${formatCurrency(avgValue)}). Keep funnel friction low for maximum conversion.`);
    }

    const html = insights.map(text => `<div class="oracle-message">${text}</div>`).join('');
    elements.oracleContainer.innerHTML = html;
  }

  function refresh() {
    if (!window.SantisRevenueTracker) {
      console.error('SantisRevenueTracker not found');
      return;
    }

    const events = window.SantisRevenueTracker.getEvents();
    renderMetrics(events);
    renderTable(events);
    renderVIPSegment(events);
    renderOracleInsights(events);
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
