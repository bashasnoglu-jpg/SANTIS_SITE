# SANTIS CLUB - STRATEGIC DECISION LOG & MEMORY

**Son Güncelleme:** 31.01.2026

Bu belge, projenin geliştirme sürecinde alınan kritik kararları ve yapısal değişiklikleri kaydeder. AI asistanı için "Uzun Süreli Hafıza" niteliğindedir.

---

## 📅 31.01.2026: TEK DİL (SINGLE LANGUAGE) KARARI

**Karar:** Projenin çok dilli (TR/EN) yapısından vazgeçilerek, sadece **Türkçe (TR)** odaklı tek dil yapısına indirilmesine karar verildi.

**Aksiyonlar:**
- [x] `en/` klasörü ve tüm içeriği silindi.
- [x] `_PROMPT_WORKBENCH.json` konfigürasyonundan İngilizce tanımları kaldırıldı.
- [x] `implementation_plan.md` üzerinden EN senkronizasyon görevleri çıkarıldı.

**Gerekçe:** Yönetim kararı (User Request). Proje odağını dağıtmamak ve bakım maliyetini düşürmek.

---

## 📅 31.01.2026: YAPISAL LİTERALİTE (STRUCTURAL INTEGRITY)

**Tespit:** "Noktası noktasına" yapılan ultra derin taramada şu eksikler saptandı ve tamamlanması GEREKİYOR:

1.  **Asset Eksikleri:**
    *   `assets/fonts/`: Yerel font dosyaları yok.
    *   `assets/icons/`: SVG ikon seti yok.
    *   `assets/vendor/`: 3. parti kütüphaneler için alan yok.

2.  **Kök Dizin Temizliği:**
    *   `docs/`: Raporlar ve dokümantasyon dosyaları bu klasörde toplanmalı.

**İlerideki Adım:** Bu eksik klasörlerin oluşturulması ve dosyaların organize edilmesi.

---
*Bu dosya, Santis Club projesinin "Kurumsal Hafızası" olarak saklanacaktır.*
