---
title: Santis OS Reconciliation Contract
version: 1.0
status: DESIGN COMPLETE — E2
authority: Santis OS Architecture Authority
effective_date: 2026-07-15
scope: Global
supersedes: FI-DI-P0.2.3.5 (Consolidation v1.1)
---

# Reconciliation Contract v1.0

## 1. Kapsam ve Temel Prensipler

Bu sözleşme, Santis OS bünyesindeki tüm finansal mutabakat (reconciliation) domain'lerinin
kanonik kurallarını, bağımlılıklarını ve tolerans politikalarını tek bir merkezi otorite
belgesinde toplar.

**Temel Prensipler:**
1. **Determinizm:** Tüm mutabakat formülleri, aynı girdiye her zaman aynı çıktıyı üretir.
2. **İzole Çalışma:** Bir kapanış işlemi, dışarıdan gelecek eş zamanlı değişikliklerden etkilenmez;
   çalışma anındaki snapshot'ı kullanır.
3. **Append-only:** Hiçbir mutabakat sonucu güncellenemez veya silinemez. Yeni bir çalışma
   yeni bir sonuç üretir.
4. **Fail-closed:** Bir upstream bağımlılık başarısızsa, downstream domain çalışmaz (BLOCKED).

---

## 2. Mutabakat Domain Envanteri

Toplam **24 mutabakat domain'i** ve **1 türetilmiş metrik** tanımlanmıştır.

| Domain ID | Açıklama | Statü |
| :--- | :--- | :--- |
| **Ödeme Ailesi** | | |
| `RCN-PAY-001` | Ödeme Net Tutar Mutabakatı | `DRAFT_READY` |
| `RCN-PAY-002` | Ödeme Brüt Tutar Mutabakatı | `DRAFT_READY` |
| **Nakit Hareket Ailesi** | | |
| `RCN-CASH-001` | Nakit Hareket Tutar Mutabakatı | `DRAFT_READY` |
| **Kapanış Ailesi** | | |
| `RCN-CLOSE-001` | Kapanış Toplam Gelir Mutabakatı | `DRAFT_READY` |
| `RCN-CLOSE-002` | Kapanış Beklenen Nakit Mutabakatı | `DRAFT_READY` |
| `RCN-CLOSE-003` | Kapanış Nakit Farkı Mutabakatı | `DRAFT_READY` |
| `RCN-CLOSE-004A` | Kapanış Ödeme Kanalı Bileşenleri | `DRAFT_READY` |
| `RCN-CLOSE-004B` | Kapanış Nakit Hareket Bileşenleri | `DRAFT_READY` |
| **Komisyon Ailesi** | | |
| `RCN-COMM-001` | Komisyon Hesaplama (Namespace) | `GROUPING_ONLY` |
| `RCN-COMM-001A` | Yüzde Bazlı Komisyon | `DRAFT_READY` |
| `RCN-COMM-001B` | Sabit Tutarlı Komisyon | `DRAFT_READY` |
| `RCN-COMM-001C` | Kademeli Komisyon | `CONFIGURATION_BLOCKED` |
| `RCN-COMM-002A` | Kural Kimliği Mutabakatı | `DRAFT_READY` |
| `RCN-COMM-002B` | Kural Anlık Görüntü Mutabakatı | `DRAFT_READY` |
| **Paket Ailesi** | | |
| `RCN-PKG-001` | Paket Kullanım Seans Mutabakatı | `DRAFT_READY` |
| `RCN-PKG-002` | Paket Kullanım Değer Mutabakatı | `DRAFT_READY` |
| `RCN-PKG-003A` | Paket Hak Bakiyesi Mutabakatı | `DRAFT_READY` |
| **Envanter Ailesi** | | |
| `RCN-INV-001` | Envanter Miktar Mutabakatı | `DRAFT_READY` |
| `RCN-INV-002` | Envanter Maliyet Mutabakatı | `DRAFT_READY` |
| **Tahsisat Ailesi** | | |
| `RCN-ALLOC-001` | Ödeme-Booking Tahsisat Mutabakatı | `DRAFT_READY` |
| `RCN-ALLOC-002` | Nakit-Booking Tahsisat Mutabakatı | `DRAFT_READY` |
| **Transfer Ailesi** | | |
| `RCN-TRAN-001A` | Transfer Miktar Çifti Mutabakatı | `DRAFT_READY` |
| `RCN-TRAN-001B` | Transfer Maliyet Çifti Mutabakatı | `DRAFT_READY` |
| **Türetilmiş Metrikler** | | |
| `MET-PKG-REMAINING-FINANCIAL-VALUE-001` | Paket Kalan Finansal Değer | `DERIVED_METRIC` |

---

## 3. Upstream Bağımlılık Ağacı

### Katman 0 — Sözleşme ve Eşleme Guard'ları
```
VAL-CASH-DIRECTION-001 (Yön Eşleme)
VAL-INV-UNIT-001 (Birim Dönüşümü)
VAL-INV-SIGN-001 (Miktar İşareti)
VAL-INV-CONTEXT-001 (Envanter Bağlamı)
VAL-PAYMENT-CHANNEL-001 (Ödeme Kanalı Eşleme)
```

### Katman 1 — Doğrudan Skaler Mutabakatlar
```
RCN-PAY-002 (Brüt Ödeme)
RCN-CASH-001 (Nakit Tutar)
RCN-PKG-001 (Seans)
RCN-INV-001 (Miktar)
```

### Katman 2 — Politika ve Anlık Görüntü Mutabakatları
```
RCN-COMM-002A → RCN-COMM-002B
```

### Katman 3 — Hesaplanan Olgular
```
RCN-PAY-001 (Net Ödeme)
RCN-INV-002 (Maliyet)
RCN-COMM-001A/B/C/D (Komisyon)
RCN-PKG-002 (Değer)
```

### Katman 4 — Tahsisat
```
RCN-ALLOC-001 (Ödeme-Booking)
RCN-ALLOC-002 (Nakit-Booking)
```

### Katman 5 — Toplulaştırma ve Kapanış
```
RCN-CLOSE-004A (Kanal Bileşenleri) ──┐
RCN-CLOSE-004B (Hareket Bileşenleri)─┤
RCN-CLOSE-001 (Toplam Gelir) ────────┼── RCN-CLOSE-002 (Beklenen Nakit)
RCN-ALLOC-001 (Tahsisat) ────────────┘      │
                                            └── HARD ── RCN-CLOSE-003 (Nakit Farkı)
```

### Katman 6 — Çapraz Sistem
```
RCN-TRAN-001A (Miktar) ── HARD ── RCN-TRAN-001B (Maliyet)
```

---

## 4. Çözümlenen Engelleyiciler (12 Resolved)

| Blocker | Domain | Karar | Tolerans | Bağımlılık |
| :--- | :--- | :--- | :--- | :--- |
| `BLK-RCN-013` | Eski `RCN-CASH-002` | Reclassify → `VAL-CASH-DIRECTION-001` | Yok (Mapping) | — |
| `BLK-RCN-011` | `RCN-CLOSE-004` | Split → `004A`, `004B` | `TOL-002` | Bağımsız |
| `BLK-RCN-012` | `RCN-TRAN-001` | Split → `001A`, `001B` | `TOL-005`, `TOL-002` | `001A` → `001B` (HARD) |
| `BLK-RCN-006` | `RCN-COMM-001` | Split → `001A`-`D` + `VAL-COMM-MANUAL-AUDIT-001` | `TOL-002`, `TOL-001` | `002A` → `002B` |
| `BLK-RCN-009` | `RCN-INV-001` | Target proof → `canonical_quantity_change` | `TOL-005` | 3 validation domain |
| `BLK-RCN-002` | `RCN-PAY-003` | Domain removed (SOURCE_FIELD_NOT_PRESENT) | — | — |
| `BLK-RCN-001` | `RCN-PAY-001` | Formula semantics → `DRAFT_READY WITH LIMITATIONS` | `TOL-002` | POLICY |
| `BLK-RCN-007` | `RCN-PKG-002` | Value definition semantics | `TOL-002` | Purchase-value SSOT |
| `BLK-RCN-008` | `RCN-PKG-003` | Split → `003A` (entitlement) + derived metric | `TOL-005` | `RCN-PKG-001` |
| `BLK-RCN-003` | `RCN-CLOSE-001` | Total revenue reconciliation | `TOL-002` | `RCN-CLOSE-004A` (HARD) |
| `BLK-RCN-004` | `RCN-CLOSE-002` | Expected cash reconciliation | `TOL-001` | Nakit akışı zinciri |
| `BLK-RCN-005` | `RCN-CLOSE-003` | Cash variance reconciliation | `TOL-CASH-VARIANCE` | `RCN-CLOSE-002` (HARD) |

---

## 5. Tolerans Politikaları

| ID | Açıklama | Değer |
| :--- | :--- | :--- |
| `TOL-001` | Mutlak Finansal Eşleşme (Immutable Fact) | 0.00 EUR |
| `TOL-002` | Formül ve Kaynak Mutabakatı | 0.01 EUR |
| `TOL-003` | Tahsisat Mutabakatı | 0.01 EUR |
| `TOL-004` | FX Kuru Mutabakatı | 0.000001 |
| `TOL-005` | Miktar Mutabakatı | 0.0001 |
| `TOL-006` | Oran Mutabakatı | 0.000001 |
| `TOL-007` | Yüzde Mutabakatı | 0.0001 |
| `TOL-CASH-VARIANCE` | Kasa Farkı Toleransı | ±5 EUR |

---

## 6. Registry v1.2 Aday Reason Code'ları

| Reason Code | Domain | Disposition |
| :--- | :--- | :--- |
| `SOURCE_VALUE_UNMAPPED` | Genel | `BLOCK` |
| `AMBIGUOUS_SOURCE_MAPPING` | Genel | `QUARANTINE` |
| `DIRECTION_TYPE_MISMATCH` | CASH | `QUARANTINE` |
| `UNIT_CONVERSION_FACTOR_MISSING` | INV | `BLOCK` |
| `QUANTITY_SIGN_CONFLICT` | INV | `QUARANTINE` |
| `ZERO_QUANTITY_MOVEMENT` | INV | `BLOCK` |
| `COMMISSION_RATE_SCALE_UNRESOLVED` | COMM | `BLOCK` |
| `COMMISSION_MANUAL_AUDIT_MISSING` | COMM | `BLOCK` |
| `COMMISSION_MANUAL_AUDIT_CONFLICT` | COMM | `QUARANTINE` |
| `PACKAGE_ENTITLEMENT_BALANCE_MISMATCH` | PKG | `BLOCK` |
| `PACKAGE_NEGATIVE_BALANCE_INTEGRITY_VIOLATION` | PKG | `QUARANTINE` |
| `PACKAGE_NEGATIVE_BALANCE_PENDING_ADJUSTMENT` | PKG | `BLOCK` |
| `CLOSING_REVENUE_BASIS_UNRESOLVED` | CLOSE | `BLOCK` |
| `CLOSING_PAYMENT_CHANNEL_UNMAPPED` | CLOSE | `BLOCK` |
| `RCN-004-UNRESOLVED-OUTFLOWS` | CLOSE | `BLOCK` |
| `RCN-005-VARIANCE-FAIL` | CLOSE | `BLOCK` + `REVIEW_REQUIRED` |
| `RCN-005-VARIANCE-WARNING` | CLOSE | `MATCHED_WITH_TOLERANCE` |
| `TRANSFER_DIRECTION_INVALID` | TRAN | `QUARANTINE` |
| `TRANSFER_QUANTITY_MISMATCH` | TRAN | `MISMATCHED` |
| `TRANSFER_COST_MISMATCH` | TRAN | `MISMATCHED` |

---

## 7. Kalan Açık Engelleyici

| Blocker | Domain | Statü | Açıklama |
| :--- | :--- | :--- | :--- |
| `BLK-RCN-010` | `RCN-SETT-001` | `SOURCE_CONTRACT_PENDING` | Settlement kaynağı için bağlayıcı sözleşme mevcut değil. P3 öncelikli. |

---

## Mühür

```
FI-DI-P0.2.3 — RECONCILIATION CONTRACT v1.0
Status: DESIGN COMPLETE — E2
Domain inventory:              24 reconciliation + 1 derived metric
Blockers resolved:              12
Blockers remaining:              1 (P3 — Settlement)
Upstream dependency tree:       6 katman
Tolerance policies:             8
Registry v1.2 candidates:       20 reason codes
DDL:                            NOT AUTHORIZED
ETL:                            NOT AUTHORIZED
Canonical acceptance:           PENDING (R0/R1 contract v1.1 upgrades + Registry v1.2)
```
