/**

 * SANTIS GLOBAL ENGINE

 * "On-Demand" Translation

 */



const santisLangList = [

    { n: "Türkçe", c: "tr" },

    { n: "English", c: "en" },

    { n: "Русский", c: "ru" },

    { n: "Deutsch", c: "de" },

    { n: "Français", c: "fr" },

    { n: "Español", c: "es" },

    { n: "Italiano", c: "it" },

    { n: "العربية", c: "ar" },

    { n: "中文", c: "zh-CN" },

    { n: "日本語", c: "ja" },

    { n: "한국어", c: "ko" },

    { n: "Português", c: "pt" },

    { n: "Nederlands", c: "nl" },

    { n: "Polski", c: "pl" },

    { n: "Svenska", c: "sv" },

    { n: "Dansk", c: "da" },

    { n: "Norsk", c: "no" },

    { n: "Suomi", c: "fi" },

    { n: "Ελληνικά", c: "el" },

    { n: "עברית", c: "iw" },

    { n: "हिन्दी", c: "hi" },

    { n: "ไทย", c: "th" },

    { n: "Tiếng Việt", c: "vi" },

    { n: "Bahasa Indonesia", c: "id" },

    { n: "Українська", c: "uk" },

    { n: "Română", c: "ro" },

    { n: "Magyar", c: "hu" },

    { n: "Čeština", c: "cs" },

    { n: "Slovenčina", c: "sk" },

    { n: "Български", c: "bg" },

    { n: "Hrvatski", c: "hr" },

    { n: "Srpski", c: "sr" },

    { n: "Slovenščina", c: "sl" },

    { n: "Eesti", c: "et" },

    { n: "Latviešu", c: "lv" },

    { n: "Lietuvių", c: "lt" },

    { n: "Azərbaycan", c: "az" },

    { n: "Қазақ тілі", c: "kk" },

    { n: "Uzbek", c: "uz" }

];



let isLoaded = false;



function openLangModal() {

    const modal = document.getElementById('santisLangModal');

    if (modal) {

        modal.style.display = 'flex';

        // Focus search if possible

        setTimeout(() => document.getElementById('langSearch')?.focus(), 100);

    }



    if (!isLoaded) {

        const s = document.createElement('script');

        s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

        document.body.appendChild(s);

        isLoaded = true;

    }

}



function googleTranslateElementInit() {

    new google.translate.TranslateElement({ pageLanguage: 'tr' }, 'google_translate_element');

}



function closeLangModal() {

    const modal = document.getElementById('santisLangModal');

    if (modal) modal.style.display = 'none';

}



function filterLangs() {

    const val = document.getElementById('langSearch').value.toLowerCase();

    renderLangs(val);

}



function renderLangs(filter = "") {

    const container = document.getElementById('langGrid');

    if (!container) return;



    container.innerHTML = "";

    santisLangList.filter(l => l.n.toLowerCase().includes(filter)).forEach(lang => {

        const d = document.createElement('div');

        d.className = "lang-card";

        d.innerText = lang.n;

        d.onclick = () => {

            const sel = document.querySelector('.goog-te-combo');

            if (sel) {

                sel.value = lang.c;

                sel.dispatchEvent(new Event('change'));

                const label = document.getElementById('activeLangName');

                if (label) label.innerText = lang.c.toUpperCase();

                closeLangModal();

            } else {

                // Retry if not ready

                setTimeout(() => d.click(), 500);

            }

        };

        container.appendChild(d);

    });

}



// Init

if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', () => renderLangs());

} else {

    renderLangs();

}

