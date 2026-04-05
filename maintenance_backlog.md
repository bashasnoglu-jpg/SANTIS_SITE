# Santis Sovereign: Maintenance Backlog (Faz 3)

*Oluşturulma Tarihi:* V60 Prime "Go-Live" Sonrası Arşiv Protokolü
*Kapsam:* Gelecek bakım döngülerinde (Maintenance) performans ve tema bütünlüğünü (Sessiz Lüks) korumak adına yapılacak otonom refactoring görevleri.

---

### 🟠 Bakiye Inline Stiller (Spagetti CSS Temizliği 2. Aşama)
Sovereign mimarisinin Ritüeller (`ritueller.html`) okyanusunu başarıyla BEM sınıflarına (`.santis-card`, `.santis-reveal`) geçirdik. DOM ağacı inanılmaz derecede rahatladı. Ancak alt kategorilerde (masaj ve cilt bakımı sayfaları) eski nesil, spagetti diye tabir ettiğimiz inline stil blokları (örn: `style="padding: 2rem; background:..."`) varlıklarını sürdürmektedir.

**Zayıflıklar:**
- Tarayıcının DOM'u boyarken (paint) HTML boyutu yüzünden fazladan yorulması.
- Global tema değişkenlerine (`var(--clr-gold)`) veya karanlık/saydam mod geçişlerine (Glassmorphism) %100 uyum sağlamaması.
- Sayfa önbellekleme (caching) mekanizmalarının etkinliğini %3 oranında düşürmesi.

**Operasyon Planı (Gelecek Sprintler):**
1. `masaj.html` sayfasındaki tüm `.card` yapıları taranacak.
2. `cilt-bakimi.html` dosyasındaki ürün vitrinleri incelenecek.
3. İçerde tespit edilen sert (inline) stiller; `santis.components.css` içerisindeki mevcut `Sovereign Component` mimarisiyle yer değiştirilerek temizlenecek.
4. Hedeflenen yapı: `class="santis-signature-card"` & `class="santis-reveal-up"`.

---
*Mühürlendi.* Bu dosya, Sovereign çekirdeği bir sonraki uyanışında (Sprint 6 / Maintenance V1) ilk analiz edilecek belgedir.
