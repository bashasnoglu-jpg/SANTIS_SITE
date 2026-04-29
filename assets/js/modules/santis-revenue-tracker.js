(function SantisRevenueTracker() {
  const STORAGE_KEY = 'santis_revenue_events_v1';

  function getEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Could not read revenue events', e);
      return [];
    }
  }

  function track(payload) {
    const events = getEvents();
    
    const newEvent = {
      ...payload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    events.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    // Emit global event for Boardroom Lite UI if listening
    window.dispatchEvent(new CustomEvent('santis:revenue:tracked', {
      detail: newEvent
    }));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.SantisRevenueTracker = {
    getEvents,
    track,
    clearAll
  };
})();
