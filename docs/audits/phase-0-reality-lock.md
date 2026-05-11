# SANTIS OS — Phase 0 Reality Lock

## Date
2026-05-09 (Audit initiated at 23:06:54+02:00)

## Goal
Measure technical debt, identify dead code, stabilize Git flow, and define canonical development rules.

## Current Canonical Branch
- main: production / stable (Current: 55914218)
- develop: integration / staging
- phase-e-prod-deployment-readiness-seal: latest validated baseline branch

## Repo Health Snapshot (2026-05-09)

### Git Status
```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### Active Phase Tags
- `phase-e-deployment-baseline-seal` (55914218) ✅
- `phase-d-port-ssot-env-hygiene-seal` (e5b5f72e) ✅
- `phase-b-zombie-code-archive-seal` (f0e76a57) ✅
- `phase-4-runtime-visual-truth-seal` (5ff22cbb) ✅

### Branch Sprawl Audit
- Total remote branches detected: 110+
- Heavy Copilot/Automated branch activity (80+ branches)
- Active feature/fix branches awaiting cleanup.

## Audit Areas
- Branch sprawl (High Priority)
- Dead files (In-progress via _archive)
- Duplicate UI systems (Legacy V5 vs V6)
- Unused JavaScript (Build-blocking scripts detected)
- Broken imports (PostCSS/Tailwind v4 sequence)
- Mixed package managers (pnpm standard enforced)
- Build/deploy instability (Unified Build established)
- Design token drift (Stitch enforced)
- Navigation/menu drift (Master JS blocks in app.js)

---
*Snapshot captured during Phase E closure and transition to Phase F.*

## 1. Gerçeklik Anlık Görüntüsü ve Sistemsel Analiz (Reality Snapshot Summary - 2026-05-11 Update)
SANTIS_SITE deposu üzerinde gerçekleştirilen kapsamlı mimari denetim, mevcut kod tabanında Tek Kaynaktan Doğruluk (Single Source of Truth - SSOT) ve deterministik mimari hedeflerini baltalayan kritik yapısal sorunları gün yüzüne çıkarmıştır. Sistemin mevcut durumunda, geliştirme süreçlerini yavaşlatan, bakım maliyetlerini artıran ve sürüm yönetimini istikrarsızlaştıran çok sayıda teknik borç ve mimari sapma tespit edilmiştir. Yazılım mühendisliği literatüründe "yazılım çürümesi" (software rot veya code decay) olarak adlandırılan bu durum, kod tabanının zaman içinde yeni gereksinimlere uyum sağlayamaması, eski tasarım kararlarının tortulaşması ve sürekli yeniden yapılandırma (refactoring) eksikliği nedeniyle ortaya çıkmaktadır. SANTIS_SITE deposunda gözlemlenen bu çürüme, özellikle dal (branch) yönetimindeki karmaşıklık, standart bir önek (prefix) sisteminin bulunmaması ve işlevini yitirmiş eski phase dallarının depoda birikmesiyle versiyon kontrol sisteminin sağlığını ciddi şekilde tehdit etmektedir.

Kod tabanının derinlemesine analizi, kullanılmayan bileşenlerin ve eski (legacy) kod bloklarının (örneğin, aktif olmayan WebSocket ve telemetri modülleri) depoda birikerek ciddi bir "ölü kod" (dead code) veya "zombi kod" (zombie code) yükü oluşturduğunu göstermektedir. Ölü kod, projenin derleme süresini uzatan, bağımlılık ağacını şişiren ve bakım maliyetlerini katlanarak artıran ciddi bir anti-desendir (anti-pattern).

## 2. Teknik Borç Kaydı ve Derinlemesine Analiz (Technical Debt Register)
*Bkz. [Technical Debt Register](./technical-debt-register.md)*

## 3. Kullanıcı Arayüzü Mimarisi ve Bileşen Birleştirme Stratejisi (UI Architecture & Component Consolidation)
Kullanıcı arayüzünde NavbarOld.tsx ve Navbar.tsx gibi birbirini tekrar eden bileşenlerin varlığı, bileşen tabanlı mimarinin temel prensibi olan "Bileşen Kompozisyonu" (Component Composition) ilkesine aykırıdır. Bu tür birikimler, React mimarisinde ölçeklenebilirliği ciddi şekilde zedelemektedir.

Kopya UI bileşenlerinin konsolidasyonu için geleneksel "çok sayıda prop geçirme" (prop drilling) yaklaşımı yerine, Bileşik Bileşenler (Compound Components) veya Slot (Yuva) desenlerinin benimsenmesi gerekmektedir.

## 4. Durum Yönetimi ve Tek Kaynaktan Doğruluk (State Management & SSOT)
localStorageCache.ts dosyasında tespit edilen bağımsız durum yönetimi, uygulamanın durum (state) senkronizasyonunu bozmaktadır. Uygulamanın durumunu doğrudan localStorage üzerinden okuyup yazmak, React'in yaşam döngüsüyle (lifecycle) çakışarak gereksiz yeniden oluşturmalara (re-renders), durumun asenkron kalmasına (hydration mismatches) ve karmaşık bağımlılık sorunlarına neden olur.

## 5. Tasarım Sapması ve Stil Denetimi Yönetişimi (Design Drift & Style Linting)
Kod tabanında #FF0000 gibi sabit (hardcoded) HEX renk kodlarının bulunması merkezi bir Tasarım Sistemi'nin sürdürülebilirliğini yok eder. Bu tasarım sapmasını durdurmak için, Stylelint ve ESLint kuralları devreye alınmalı, `stylelint-declaration-strict-value` kuralları uygulanmalıdır.

## 6. Paket Yöneticisi ve Kilit Dosyası Çatışmaları (Lockfile & Tooling Debt)
Depoda hem package-lock.json (npm) hem de pnpm-lock.yaml (pnpm) dosyalarının aynı anda bulunması sürüm kaymalarına yol açmaktadır. Paket yöneticisi pnpm olarak tekleştirilmelidir.

## 7. Ölü Kod Yönetimi ve Devreden Çıkarma Stratejisi (Dead Code Management & Decommissioning)
SANTIS_SITE projesinde ölü kodların temizlenmesi için "Karantina ve Silme" (Quarantine and Deletion) iş akışı uygulanmalıdır. Tespit edilen dosyalar git geçmişinde izole bir dizine (`_archive/phase-0-dead-code/`) taşınacaktır.

## 8. Git Akış Yönetişimi ve Depo Politikaları (Git Flow Governance)
### 8.1. Dal İsimlendirme Konvansiyonu (Branch Naming Standards)
- `feature/`
- `fix/`
- `chore/`
- `docs/`
- `refactor/`

### 8.2. Dal Koruma Kuralları (Branch Protection Rules)
- Doğrudan Push ve Force Push Yasaklaması.
- Zorunlu Çekme İstekleri (Require Pull Request).

## 9. Standart Çekme İsteği (Pull Request) ve Bitti Tanımı (Definition of Done)
Standart bir Çekme İsteği Şablonu (`.github/PULL_REQUEST_TEMPLATE.md`) ve Bitti Tanımı (DoD) listesi zorunlu kılınacaktır.

## 10. Güvenli Temizlik ve Otomasyon
Tüm temizlik işlemleri `_archive/` dizini üzerinden takip edilecek ve her dosya hareketi `archive-manifest.md` dosyasına kaydedilecektir.
