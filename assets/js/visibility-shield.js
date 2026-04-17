export function bindVisibilityShield(engine, element) {
  let inViewport = true;

  const onVisibilityChange = () => {
    const shouldPause = document.hidden || !inViewport;
    if (shouldPause) engine.pause();
    else engine.resume();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  let observer = null;

  if (element && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inViewport = Boolean(entry && entry.isIntersecting);
        onVisibilityChange();
      },
      { threshold: 0.01 }
    );

    observer.observe(element);
  }

  onVisibilityChange();

  return function cleanup() {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (observer) observer.disconnect();
  };
}
