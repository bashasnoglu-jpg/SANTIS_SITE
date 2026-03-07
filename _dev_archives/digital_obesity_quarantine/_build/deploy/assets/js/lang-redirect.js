(function () {
    var COOKIE = 'santis_lang';
    var cookies = document.cookie.split(';');
    var savedLang = '';

    // 1. Check for saved language preference
    for (var i = 0; i < cookies.length; i++) {
        var c = cookies[i].trim();
        if (c.indexOf(COOKIE + '=') === 0) {
            savedLang = c.substring(COOKIE.length + 1);
            break;
        }
    }

    if (savedLang && ['tr', 'en', 'de', 'fr', 'ru', 'sr'].indexOf(savedLang) !== -1) {
        window.location.replace('/' + savedLang + '/index.html');
        return;
    }

    // 2. Try browser language detection
    var browserLang = (navigator.language || navigator.userLanguage || 'tr').substring(0, 2).toLowerCase();
    var langMap = { tr: 'tr', en: 'en', de: 'de', fr: 'fr', ru: 'ru', sr: 'sr' };
    var target = langMap[browserLang] || 'tr';

    // 3. Set cookie and redirect
    document.cookie = COOKIE + '=' + target + '; path=/; max-age=31536000';
    window.location.replace('/' + target + '/index.html');
})();
