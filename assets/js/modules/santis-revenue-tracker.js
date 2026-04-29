(function SantisRevenueTracker() {
  const LOG_KEY = 'santis_revenue_events_v1';
  const MAX_EVENTS = 250;

  function readEvents() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (error) {
      console.warn('[Santis Revenue Tracker] Failed to read events.', error);
      return [];
    }
  }

  function writeEvents(events) {
    localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  }

  function normalizeEvent(event) {
    return {
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      ts: Date.now(),
      source: 'public-booking-funnel',
      ...event,
    };
  }

  function track(event) {
    const events = readEvents();
    const normalized = normalizeEvent(event);
    events.push(normalized);
    writeEvents(events);

    window.dispatchEvent(
      new CustomEvent('santis:revenue-event', {
        detail: normalized,
      })
    );

    return normalized;
  }

  function clear() {
    localStorage.removeItem(LOG_KEY);
    window.dispatchEvent(new CustomEvent('santis:revenue-cleared'));
  }

  function getEvents() {
    return readEvents();
  }

  function aggregate(events = readEvents()) {
    const leads = events.filter((event) => event.type === 'booking_handoff');
    const vipLeads = leads.filter((event) => event.leadTag === '[VIP-LEAD]');
    const priorityLeads = leads.filter((event) => event.leadTag === '[PRIORITY]');
    const upsellLeads = leads.filter((event) => Boolean(event.upsell));
    const scarcityLeads = leads.filter((event) => Boolean(event.scarcityMessage));
    const todayOrTomorrow = leads.filter((event) => {
      return event.time === 'Bugün' || event.time === 'Yarın';
    });

    const estimatedRevenue = leads.reduce((sum, event) => {
      return sum + Number(event.estimatedValue || 0);
    }, 0);

    const totalGuests = leads.reduce((sum, event) => {
      return sum + Number(event.guests || 1);
    }, 0);

    const ritualCounts = leads.reduce((map, event) => {
      const ritual = event.ritual || 'Concierge önerisi';
      map[ritual] = (map[ritual] || 0) + 1;
      return map;
    }, {});

    const topRitual = Object.entries(ritualCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Henüz yok';

    return {
      totalLeads: leads.length,
      vipLeads: vipLeads.length,
      priorityLeads: priorityLeads.length,
      estimatedRevenue,
      avgLeadValue: leads.length ? Math.round(estimatedRevenue / leads.length) : 0,
      avgGuests: leads.length ? Number((totalGuests / leads.length).toFixed(1)) : 0,
      topRitual,
      upsellAttachRate: leads.length ? Math.round((upsellLeads.length / leads.length) * 100) : 0,
      scarcityTriggerRate: leads.length ? Math.round((scarcityLeads.length / leads.length) * 100) : 0,
      nearTermDemandRate: leads.length ? Math.round((todayOrTomorrow.length / leads.length) * 100) : 0,
      leads,
    };
  }

  window.SantisRevenueTracker = {
    track,
    clear,
    getEvents,
    aggregate,
  };
})();
