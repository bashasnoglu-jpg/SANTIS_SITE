// Inject canonical link into <head> based on PAGE_GROUP_ID
(function injectCanonical() {
  document.addEventListener("DOMContentLoaded", async () => {
    const groupId = window.PAGE_GROUP_ID;
    const host = window.location.hostname;
    const allowRemote = false; // Disabled for Static Deployment
    if (!groupId || !allowRemote) return;

    try {
      const res = await fetch(`/api/canonical/${encodeURIComponent(groupId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.canonical) return;

      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.origin + data.canonical;
      document.head.appendChild(link);

      console.log("🏷️ Canonical tag injected:", link.href);
    } catch (err) {
      console.warn("Canonical injection failed", err);
    }
  });
})();
