export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        });

        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
                if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                ) {
                    console.info("[PWA] New version installed and waiting.");
                    window.dispatchEvent(
                        new CustomEvent("santis:pwa-update-ready"),
                    );
                }
            });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
        });
    } catch (error) {
        console.error("[PWA] Service worker registration failed", error);
    }
}

// Ensure the wait is triggered
window.addEventListener("santis:pwa-update-ready", async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
});
