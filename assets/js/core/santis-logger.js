/**
 * ==========================================
 * 🤫 SANTIS LOGGER (NARRATIVE SILENCE)
 * Canlı ortamda gereksiz konsol mesajlarını
 * susturup işlemciyi yormaması için V1 Zırhı.
 * ==========================================
 */

const isDevMode = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

window.SantisLog = function(message, type = "info") {
    if (!isDevMode) return; // Canlıdaysan sus, performans harcama.

    if (type === "error") {
        console.error(message);
    } else if (type === "warn") {
        console.warn(message);
    } else if (type === "success") {
        console.log(`%c${message}`, "color: #10b981; font-weight: bold;");
    } else {
        console.log(message);
    }
};

// Console hook iptali veya doğrudan `console.log` metodunu ezen agresif sürüm (Opsiyonel)
// Şimdilik sadece Santis modüllerinden SantisLog() çağrılacak.
