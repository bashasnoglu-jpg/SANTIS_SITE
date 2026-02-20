// Inject Service schema (JSON-LD) into <head> based on PAGE_GROUP_ID
(function injectSchema() {
  document.addEventListener("DOMContentLoaded", async () => {
    const groupId = window.PAGE_GROUP_ID;
    if (!groupId) return;

    try {
      const res = await fetch(`/api/schema/${encodeURIComponent(groupId)}`);
      if (!res.ok) return;
      const schema = await res.json();
      if (!schema || !schema["@type"]) return;

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);

      console.log("⭐ Schema.org JSON-LD injected");
    } catch (err) {
      console.warn("Schema injection failed", err);
    }
  });
})();
