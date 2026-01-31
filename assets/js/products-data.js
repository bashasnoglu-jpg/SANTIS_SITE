// assets/js/products-data.js
// SANTIS CLUB - PRODUCT COLLECTION
(function () {
    const products = [
        {
            id: "sothys-hydrating-cream",
            title: "Hydrating Satin Cream",
            brand: "Sothys",
            price: 120,
            desc: "Cildi derinlemesine nemlendiren ve ipeksi bir doku kazandıran lüks bakım kremi.",
            img: "assets/img/cards/product-cream.png",
            category: "skincare"
        },
        {
            id: "sothys-body-oil",
            title: "Elixir Relipidant Body Oil",
            brand: "Sothys",
            price: 85,
            desc: "Vücut için besleyici ve tazeleyici, esansiyel yağlarla zenginleştirilmiş vücut yağı.",
            img: "assets/img/cards/product-oil.png",
            category: "bodycare"
        },
        {
            id: "hammam-soap-set",
            title: "Santis Signature Soap Set",
            brand: "Santis",
            price: 45,
            desc: "Geleneksel hamam ritüellerinden ilham alan, zeytinyağlı ve defneli özel sabun seti.",
            img: "assets/img/cards/product-soap.png",
            category: "home-spa"
        },
        {
            id: "aroma-candle",
            title: "Calm & Zen Aroma Candle",
            brand: "Santis",
            price: 60,
            desc: "Evinizde spa atmosferi yaratmak için tasarlanmış odunsu ve baharatlı notalara sahip mum.",
            img: "assets/img/cards/detail.png", // Reusing existing asset
            category: "home-spa"
        }
    ];

    window.NV_PRODUCTS = products;
    console.log("✅ Products Data Loaded");
})();
