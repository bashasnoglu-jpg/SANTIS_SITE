/**

 * 🔮 SANTIS HOLOGRAM - ON-SITE EDITOR v1.0

 * Allows direct content editing on the live website.

 * Trigger: Alt + Click on text.

 */



window.SantisHologram = (function () {

    let isActive = false;



    function init() {

        console.log("🔮 [Hologram] System Standing By. (Alt + Click to Edit)");

        document.addEventListener('click', handleClick, true);



        // Add minimal CSS for edit mode

        const style = document.createElement('style');

        style.innerHTML = `

            [contenteditable="true"] {

                outline: 2px solid #d4af37;

                background: rgba(212, 175, 55, 0.1);

                cursor: text;

                transition: all 0.2s;

            }

            [contenteditable="true"]:focus {

                background: rgba(0,0,0,0.8);

                color: #fff;

                z-index: 1000;

                position: relative;

            }

        `;

        document.head.appendChild(style);

    }



    function handleClick(e) {

        // TRIGGER: Alt + Click

        if (!e.altKey) return;



        // Find editable target

        const target = e.target;

        const card = target.closest('[data-id]');



        if (!card) return;



        e.preventDefault();

        e.stopPropagation();



        startEditing(target, card.dataset.id);

    }



    function startEditing(element, productId) {

        // Identify Field

        let field = null;

        if (element.tagName === 'H4' || element.tagName === 'H3') field = 'name';

        else if (element.classList.contains('prod-cat') || element.classList.contains('category')) field = 'category';

        else if (element.classList.contains('price') || element.innerText.includes('€') || element.innerText.includes('TL')) field = 'price';

        else if (element.tagName === 'P') field = 'description';



        if (!field) {

            console.warn("🔮 [Hologram] Unknown field type.");

            return;

        }



        console.log(`🔮 [Hologram] Editing Product #${productId} - Field: ${field}`);



        element.contentEditable = "true";

        element.focus();



        // SAVE ON BLUR or ENTER

        const saveHandler = () => {

            const newValue = element.innerText.trim();

            saveChange(productId, field, newValue);



            // Cleanup

            element.contentEditable = "false";

            element.removeEventListener('blur', saveHandler);

            element.removeEventListener('keydown', keyHandler);

        };



        const keyHandler = (e) => {

            if (e.key === 'Enter') {

                e.preventDefault();

                element.blur();

            }

        };



        element.addEventListener('blur', saveHandler);

        element.addEventListener('keydown', keyHandler);

    }



    async function saveChange(id, field, value) {

        console.log(`🔮 [Hologram] Saving: Product #${id} [${field}] = "${value}"`);



        // 1. UPDATE ASYNC VAULT (Persistence)

        const stored = await SantisVault.getItem("santis_products");

        if (stored) {

            const catalog = typeof stored === 'string' ? JSON.parse(stored) : stored;

            const product = catalog.find(p => p.id == id);

            if (product) {

                product[field] = value;

                // Support legacy aliases

                if (field === 'category') product.cat = value;

                if (field === 'name') product.title = value; // if strictly title used elsewhere



                await SantisVault.setItem("santis_products", catalog);

                console.log("💾 [Hologram] Santis Vault Updated.");

            }

        }



        // 2. BROADCAST (Neural Bridge)

        if (window.SantisBrain) {

            window.SantisBrain.broadcast(window.SantisBrain.EVENTS.PRODUCT_UPDATED, {

                id: id,

                field: field,

                value: value,

                source: 'hologram'

            });

        }

    }



    return {

        init

    };



})();



// Auto-Init

if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', window.SantisHologram.init);

} else {

    window.SantisHologram.init();

}

