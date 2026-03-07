/**

 * SANTIS SERVICE LOADER (v1.0)

 * Binds URL Data (id/slug) to Cinematic Detail Template

 */



document.addEventListener("DOMContentLoaded", async () => {

    // 🛡️ Auto-Depth Helper

    const determineRoot = () => {

        if (window.SITE_ROOT) return window.SITE_ROOT;

        const depth = window.location.pathname.split('/').length - 2;

        return depth > 0 ? "../".repeat(depth) : "";

    };



    // 1. Wait for Product Data (Global Promise if available, else retry)

    if (!window.productCatalog) {

        console.warn("Service Loader: Data not ready. Retrying...");

        setTimeout(() => location.reload(), 500); // Simple retry for now

        return;

    }



    // 2. Parse URL

    const params = new URLSearchParams(window.location.search);

    const id = params.get('id');

    const slug = params.get('slug');



    if (!id && !slug) {

        console.warn("Service Loader: No ID provided. Showing default state.");

        document.querySelector('.cin-title').innerText = "Hizmet Seçiniz";

        document.querySelector('.cin-desc').innerText = "Lütfen koleksiyondan bir hizmet seçerek detayları görüntüleyin.";

        return;

    }



    // 3. Find Product (Strict Match to prevent '1' == 1 collision)

    let item = window.productCatalog.find(p => {

        // String IDs (Massages) vs Number IDs (Skincare)

        // If ID param is a number (1, 2...), it matches Skincare. 

        // If ID param is string (classic-aroma...), it matches Massages.



        const paramId = id;

        const prodId = p.id;



        // Exact match preferred

        if (prodId === paramId) return true;

        if (p.slug === slug) return true;



        // Loose match ONLY if types align (Prevent '1' matching 1 if we expect string)

        // Actually, safest is to convert both to string for comparison IF they are meant to be same

        return String(prodId) === String(paramId);

    });



    if (!item) {

        document.querySelector('.cin-title').innerText = "Hizmet Bulunamadı";

        return;

    }



    // 4. Bind Data (Cinema Mode)

    console.log(`🎬 Binding Service: ${item.name}`);



    // Title & Text

    setText('.cin-title', item.name || item.title);

    setText('.cin-subtitle', item.tier ? `Santis ${item.tier} Collection` : 'Santis Spa Rituals');

    setText('.cin-desc', item.desc);



    // Breadcrumb

    const catName = resolveCategoryName(item.cat);

    setText('#bread-cat', catName);



    // Meta Fields

    setText('#val-benefit', item.benefit || 'Genel Rahatlama');

    setText('#val-usage', item.usage || 'Standart Uygulama');

    setText('#val-duration', item.duration || '50 / 80 Dk'); // Fallback if missing



    // Visuals

    const imgPath = `${determineRoot()}assets/img/cards/${item.img}`;

    const visual = document.querySelector('.cin-visual-img');

    if (visual) {

        visual.src = imgPath;

        visual.parentElement.classList.add('loaded'); // Animation Trigger

    }



    // Actions

    const waBtn = document.getElementById('btn-whatsapp');

    if (waBtn) {

        const msg = `Merhaba, ${item.name} hakkında randevu almak istiyorum.`;

        waBtn.href = `https://wa.me/905348350169?text=${encodeURIComponent(msg)}`;

    }



    // Update Page Title

    document.title = `${item.name} • Santis Club`;



});



// Helper

function setText(selector, text) {

    const el = document.querySelector(selector);

    if (el) el.innerText = text || '';

}



// Fallback Cat Name (if not global)

// Fallback Cat Name (if not global)

function resolveCategoryName(cat) {

    if (typeof window.getCatName === 'function') return window.getCatName(cat);



    const map = {

        'massage-classic': 'Klasik Masajlar',

        'massage-thai': 'Thai Terapileri',

        'massage-bali': 'Bali Masajları',

        'massage-ayur': 'Ayurveda',

        'massage-clinical': 'Klinik Masajlar',

        'massage-anticellulite': 'Vücut Şekillendirme',

        'massage-detox': 'Detox & Zayıflama'

    };

    return map[cat] || 'Terapi';

}

