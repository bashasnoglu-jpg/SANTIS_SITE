# Airtable Reception UI Cleanup Checklist

Bu doküman, Santis OS Airtable arayüzünü (UI) mevcut şube (branch) standartlarına uygun olarak sadeleştirmek amacıyla hazırlanmış manuel bir view (görünüm) yeniden adlandırma ve düzenleme listesidir.

## 🎯 Hedef
Günlük operasyonlarda (Daily Reception) şube bazlı görünümlerin öncelikli olmasını sağlamak; şablon, onay ve finansal verilerin yer aldığı görünümleri yetki bazlı (80 MANAGER / 90 ADMIN) ön ekler ile düzenleyip alt kısımlara taşımak.

## 📋 Mevcut Şube Standardı (Reception Görünümleri)
Resepsiyon personelinin kullanacağı ve arayüzde en üstte kalacak standart şube görünümleri:

- [ ] `01 BUDVA`
- [ ] `02 PODGORICA`
- [ ] `03 KOTOR`
- [ ] `04 TIVAT`
- [ ] `05 ANTALYA`

## 📊 80 MANAGER (Yönetici Görünümleri)
Aşağıdaki görünümler sadece yöneticilerin kullanımına uygun olarak "80 MANAGER" prefix'i ile yeniden adlandırılmalı ve yöneticilere ayrılmış bir View Section'a taşınmalıdır.

- [ ] `08 RECEPTION — Package Audit` ➡️ `80 MANAGER — Package Audit`
- [ ] `11 RECEPTION — Daily Revenue` ➡️ `80 MANAGER — Daily Revenue`

## ⚙️ 90 ADMIN (Sistem Yöneticisi Görünümleri)
Teknik, yapılandırma veya şablon amaçlı görünümler "90 ADMIN" prefix'i ile güncellenmeli ve genel kullanıcı arayüzünden gizlenmelidir.

- [ ] `00 TEMPLATE — Daily View` ➡️ `90 ADMIN — TEMPLATE — Daily View`
- [ ] `Faz 1-C — Booking Control` ➡️ `90 ADMIN — Faz 1-C Booking Control`

## 🛠️ Uygulama Adımları (Aksiyon Planı)

1. **İsimlendirme (Rename):** İlgili görünümlere sağ tıklayıp "Rename view" diyerek yeni prefix'leri (80 MANAGER / 90 ADMIN) ekleyin.
2. **View Sections (Klasörleme):** "80 MANAGER" ve "90 ADMIN" isimli iki yeni Sidebar section oluşturun.
3. **Taşıma:** Yeniden adlandırdığınız görünümleri bu yeni section'lara sürükleyip bırakın.
4. **Şubeleri Koruyun:** `01 BUDVA`, `02 PODGORICA` vb. görünümlerin en üstte, ulaşılabilecek konumda kaldığından emin olun. Herhangi bir view veya record silmeyin.
