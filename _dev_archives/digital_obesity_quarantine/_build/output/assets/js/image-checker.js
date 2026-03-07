/**

 * SANTIS IMAGE CHECKER v1.0

 * 

 * Bu script sayfadaki tüm resimlerin (img tagleri) yüklenip yüklenmediğini kontrol eder.

 * Kırık resimleri kırmızı çerçeve ile işaretler ve konsola rapor basar.

 * 

 * Kullanım:

 * 1. Bu dosyayı projenize dahil edin: <script src="/assets/js/image-checker.js"></script>

 * 2. Veya tarayıcı konsoluna (F12) yapıştırıp enter'a basın.

 */



(function () {

    'use strict';



    function runCheck() {

        console.group("🔍 SANTIS GÖRSEL KONTROLÜ");



        const images = document.querySelectorAll('img');

        let issues = [];

        let loadedCount = 0;



        if (images.length === 0) {

            console.warn("⚠️ Sayfada hiç <img> etiketi bulunamadı.");

            console.groupEnd();

            return;

        }



        images.forEach((img, i) => {

            const src = img.getAttribute('src');

            // Resim tamamlanmış mı ve doğal genişliği 0'dan büyük mü?

            const isLoaded = img.complete && img.naturalWidth > 0;



            if (!src) {

                issues.push({ type: 'EKSİK SRC', el: img, msg: 'Src attribute boş' });

                highlightError(img);

            } else if (!isLoaded) {

                issues.push({ type: 'KIRIK RESİM', el: img, msg: src });

                highlightError(img);

            } else {

                loadedCount++;

            }

        });



        if (issues.length === 0) {

            console.log(`%c✅ MÜKEMMEL: ${loadedCount} görselin hepsi sorunsuz yüklendi.`, "color: green; font-weight: bold; font-size: 14px;");

        } else {

            console.log(`%c❌ ${issues.length} ADET SORUNLU GÖRSEL BULUNDU`, "color: red; font-weight: bold; font-size: 14px;");

            console.table(issues.map(i => ({ Tip: i.type, Kaynak: i.msg })));

            console.log("💡 İpucu: Sorunlu görseller sayfada kırmızı çerçeve ile işaretlendi.");

        }



        console.groupEnd();

    }



    function highlightError(el) {

        el.style.border = "5px solid red";

        el.style.opacity = "0.5";

        el.setAttribute("title", "BU RESİM YÜKLENEMEDİ");

    }



    // Sayfa tamamen yüklendiğinde çalıştır

    if (document.readyState === 'complete') {

        runCheck();

    } else {

        window.addEventListener('load', runCheck);

    }



    // Manuel tetikleme için global fonksiyon

    window.checkImages = runCheck;

})();
