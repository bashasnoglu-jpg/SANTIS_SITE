/* SANTIS POLYGLOT ENGINE v1.0 */
// 1. Google Translate'i Başlat
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'tr',
        // Hedef Diller: İngilizce, Rusça, Almanca, Arapça
        includedLanguages: 'tr,en,ru,de,ar',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

// 2. Dil Değiştirici (Cookie Hack)
function changeLanguage(langCode) {
    // Çerezi ayarla: Google bu çerezi okuyup dili otomatik değiştirir
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 Gün hatırla

    // Çerezleri hem kök dizine hem domaine yaz (Garanti olsun)
    const cookieString = `googtrans=/tr/${langCode}; expires=${date.toUTCString()}; path=/`;
    document.cookie = cookieString;
    document.cookie = cookieString + `; domain=${window.location.hostname}`;

    // Sayfayı yenile ki dil aktif olsun
    window.location.reload();
}

// 3. Mevcut Dili Göster
document.addEventListener('DOMContentLoaded', () => {
    const cookies = document.cookie.split(';');
    let currentLang = 'TR'; // Varsayılan

    cookies.forEach(c => {
        if (c.includes('googtrans')) {
            // Çerezden dili çek (/tr/en -> en)
            const val = c.split('=')[1];
            const lang = val.split('/')[2];
            if (lang) currentLang = lang.toUpperCase();
        }
    });

    const display = document.querySelector('.current-lang span');
    if (display) display.innerText = currentLang;
});

// 4. Google Scriptini Yükle
(function () {
    const gtScript = document.createElement('script');
    gtScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(gtScript);
})();
