// Inject hreflang alternate links into <head> based on PAGE_GROUP_ID
(async function injectHreflangLinks() {
  const groupId = window.PAGE_GROUP_ID;
  if (!groupId) return;

  try {
    const res = await fetch(`/api/hreflang/${groupId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.alternates || !data.alternates.length) return;

    const head = document.head;
    const origin = window.location.origin;

    data.alternates.forEach(alt => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = alt.lang;
      link.href = origin + alt.url;
      head.appendChild(link);
    });

    const xDefault = data.alternates.find(a => a.lang === "en") || data.alternates[0];
    if (xDefault) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = "x-default";
      link.href = origin + xDefault.url;
      head.appendChild(link);
    }

    console.log("🌍 Hreflang tags injected");
  } catch (err) {
    console.warn("Hreflang injection failed", err);
  }
})();
