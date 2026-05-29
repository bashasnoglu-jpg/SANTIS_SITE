if (window.location.protocol === 'file:') {
  const normalizedPath = window.location.pathname.replace(/\\/g, '/');
  const marker = '/santis_site/';
  const markerIndex = normalizedPath.toLowerCase().lastIndexOf(marker);
  const routePath = markerIndex >= 0
    ? normalizedPath.slice(markerIndex + marker.length - 1)
    : '/tr/index.html';

  window.location.replace(`http://127.0.0.1:5500${routePath}${window.location.search}${window.location.hash}`);
}

if (window.location.protocol === 'http:' && window.location.hostname === '127.0.0.1') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach((registration) => registration.unregister()))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {});
  }
}
