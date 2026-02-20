/**
 * Santis Club Ultra Derin Admin Panel Raportörü (Google Gemini API)
 * Amaç: Admin panel URL/Sayfa zafiyet listesini JSON olarak toplayıp
 * doğrudan Google Gemini API'sine göndererek V3 Final Admin Raporu'nu (Markdown) üretmek.
 *
 * Kurulum:
 * npm install @google/generative-ai dotenv
 * .env dosyasına GEMINI_API_KEY=AIxxxx ekleyin.
 *
 * Çalıştırmak için:
 * node generate_admin_report_ai.js
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// .env kullanıldığından yapılandırmayı aktif ettik
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Kendi API anahtarınızı girin veya process.env.GEMINI_API_KEY üzerinden çekin.
const API_KEY = process.env.GEMINI_API_KEY || "BURAYA_GOOGLE_GEMINI_API_ANAHTARINIZI_GIRIN";
const genAI = new GoogleGenerativeAI(API_KEY);

// Admin panelinden veya tarayıcıdan çekilen örnek DOM verisi (Dummy Veri)
const reportData = [
    {
        url: "en/skincare/acne-balance.html",
        category: "SKINCARE_EN",
        header: true,
        footer: true,
        hero: true,
        breadcrumb: true,
        schema: true,
        orphan: false,
        canonical: true,
        hreflang: true,
        metaDescription: "Advanced Acne Balance Skincare treatment...",
        ogTitle: "Acne Balance Routine",
        duplicateContent: false,
        cls: "0.01",
        imgAttrs: "lazy/async set",
        jsListener: "secure",
        langSwitch: "synced"
    },
    {
        url: "de/massagen/thai-massage.html",
        category: "MASSAGE_DE",
        header: true,
        footer: true,
        hero: true,
        breadcrumb: true,
        schema: true,
        orphan: false,
        canonical: true,
        hreflang: true,
        duplicateContent: false,
        cls: "0.0",
        jsListener: "secure"
    }
];

async function generateReport() {
    console.log("🚀 Santis Club Ultra Derin Rapor AI Üreticisi Başlatıldı (Google Gemini)...");
    console.log(`📊 ${reportData.length} Sayfalık veri analize gönderiliyor...\n`);

    const aiPrompt = `
SENARYO: Sen bir Senior Web Auditor / Site Health Analyzer uzmanısın.
Aşağıdaki JSON verisini kullanarak Santis Club admin panelinde tüm sayfa gruplarının,
kategori bazlı içerik ve teknik bileşenlerinin durumunu değerlendir.

JSON VERİSİ:
${JSON.stringify(reportData, null, 2)}

GÖREV:
1. Her kategori için tablo oluştur: Sayfa grubu, sayfa sayısı, tespit edilen zafiyetler, eksik/tamamlanmış müdahaleler, durum (🟢 Tamam, 🟡 Orta, 🔴 Kritik)
2. Kategori bazlı özet: Kritik, Orta, Düşük öncelikli sorunların genel özeti.
3. Çıktıyı tam ve kusursuz bir Markdown (.md) formatında hazırla. "Quiet Luxury" marka tonunu yansıt. Raporun başlığı "SANTIS CLUB V3 LÜKS SİSTEM ANALİZİ" olsun.
`;

    try {
        // gemini-2.5-flash veya gemini-pro kullanılabilir. Güncel standart flash modeldir.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Sen kıdemli bir yazılım denetmeni ve yöneticisisin. Cevapların her zaman teknik, net ve analitik olmalıdır."
        });

        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const finalReportHTML = response.text();

        console.log("✅ Rapor Google Gemini Tarafından Başarıyla Oluşturuldu!\n");
        console.log("==========================================");
        console.log(finalReportHTML);
        console.log("==========================================\n");

        // Dosyaya yazdır
        const filePath = "ULTRA_DERIN_AI_RAPORU.md";
        fs.writeFileSync(filePath, finalReportHTML, "utf8");
        console.log(`💾 Rapor dosyası diskte kaydedildi: ${filePath}`);

    } catch (error) {
        console.error("❌ API İletişim Hatası:", error.message);
    }
}

// Skripti çalıştır
generateReport();
