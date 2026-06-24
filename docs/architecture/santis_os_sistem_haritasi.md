# Santis OS — Ultra Detaylı Sistem Haritası

Airtable’daki gerçek şemaya göre Santis OS artık sadece “rezervasyon tablosu” değil. Sistem şu anda **spa operasyon omurgası** gibi kurulmuş durumda:

```text
Tenant / İşletme
↓
Locations / Şubeler
↓
Services + Rooms + Therapists + Staff_Shifts
↓
Bookings / Rezervasyon
↓
Payments + Cash_Movements + Daily_Cash_Closing
↓
Packages + Inventory + Commission + CRM
↓
Backup + Offline Schedule + Governance
↓
Gelecekte React Admin Panel + Backend API + PostgreSQL
```

Net yorumum:

```text
Sistem temeli güçlü.
Tabloların çoğu doğru yerde.
Asıl borç tablo eksikliği değil;
görünüm sadeleştirme, canlı vardiya, ödeme/kasa testleri ve otomasyon tarafında.
```

---

# 1. Ana Sistem Katmanları

## 1.1 Tenant / SaaS Katmanı

Bu katman Santis OS’un ileride başka spa/hotel işletmelerine SaaS olarak açılmasını sağlar.

Ana tablolar:

```text
Tenants
Tenant_Users
Subscription_Plans
Tenant_Subscriptions
Billing_Invoices
Feature_Access
Tenant_Onboarding_Queue
SaaS_Module_Integration_Map
```

Amaç:

```text
Her işletme ayrı olsun.
Her şube doğru tenant altında çalışsın.
Her kullanıcı sadece kendi işletmesini/şubesini görsün.
Plan, abonelik, fatura ve modül erişimi yönetilsin.
```

Şu anki karar:

```text
Faz 1 için SaaS katmanı bekler.
Önce Santis Club operasyonu çalışmalı.
```

Bu katman güçlü ama şu anda günlük resepsiyonun ana konusu değil.

---

# 2. Şube / Lokasyon Katmanı

Ana tablo:

```text
Locations
```

Bağlı tablolar:

```text
Rooms
Therapists
Staff_Shifts
Bookings
Payments
Inventory
Cash_Register
Cash_Movements
Daily_Cash_Closing
Backup_Offline_Log
CRM_Signals
Tasks
```

Locations tablosunun görevi:

```text
Budva
Podgorica
Kotor
Tivat
Antalya
QA / demo şubeler
```

gibi her operasyon noktasını ayırmak.

Kritik alanlar:

```text
Name
Timezone
Country
City
Default Start Hour
Default End Hour
Display Currency
Accepted Payment Currencies
Accounting Currency
Default Language
Schedule Mode
After Hours Booking Enabled
Slot Interval Minutes
Tenant_Link
```

Çok önemli kural:

```text
Rezervasyon hangi şubeye aitse Location_Link mutlaka dolu olmalı.
Location_Link boş rezervasyon canlı operasyon için risklidir.
```

---

# 3. Hizmet / Ritüel Katmanı

Ana tablo:

```text
Services
```

Görev:

```text
Masaj
Hamam
Cilt Bakımı
Paket içi hizmetler
Medikal / etkili hizmetler
```

Kritik alanlar:

```text
Name
Category
Duration_Minutes
Price_EUR
Active
Required_Room_Type
Alternative_Room_Types
Required_Staff_Skill
Service_Delivery_Mode
Capacity_Mode
Tenant_Link
```

Bağlandığı yerler:

```text
Bookings
Package_Usage_Ledger
Service Consumption Rules
Commission Rules
Commission Ledger
Guest Memory
Inventory_Transactions
```

Kural:

```text
Hizmet süresi Services.Duration_Minutes alanından gelmeli.
Bookings içindeki süre alanı servis süresine göre doğru hesaplanmalı.
```

Faz 1 için kritik sebep:

```text
Terapist bir sonraki masajı saat kaçta alabilir?
Bunu ancak hizmet süresi doğruysa hesaplarız.
```

---

# 4. Terapist / Personel Katmanı

Ana tablo:

```text
Therapists
```

Görev:

```text
Terapist kartı
Yetkinlik
Aktiflik
Şube bağlantısı
Günlük kapasite
Performans
Komisyon bağlantısı
```

Kritik alanlar:

```text
Name
Telefon
Status
Staff_Role
Skill_Tags
Active
Default_Commission_Rate
Location_Link
Staff_Shifts
Today's Bookings
Today's Minutes
Today's Hours
Today's Revenue
Utilization %
Revenue Per Hour
Remaining Minutes
Remaining Hours
Tenant_Link
```

Bu tablo “personel kimliği”dir.

Ama canlı takvim için tek başına yeterli değildir.

Doğru canlı kaynak:

```text
Staff_Shifts
```

---

# 5. Staff_Shifts / Canlı Vardiya Katmanı

Ana tablo:

```text
Staff_Shifts
```

Bu tablo şu anda Faz 1’in en kritik borç alanlarından biri.

Görev:

```text
Bugün kim çalışıyor?
Hangi şubede çalışıyor?
Saat kaçta başlıyor?
Saat kaçta bitiyor?
Scheduler’da görünmeli mi?
```

Kritik alanlar:

```text
Shift_ID
Staff_Link
Location_Link
Shift_Date
Shift_Start
Shift_End
Shift_Status
Scheduler Visibility
Daily Shift Standard Check
Tenant_Link
```

Doğru canlı kural:

```text
Active veya Scheduled = canlı scheduler’da görünebilir
Off / Sick / Cancelled = görünmemeli
Planned = henüz canlı değil
```

Şu anki borç:

```text
Bugün için sadece QA/demo shift bulundu.
Canlı Santis Club şube vardiyaları görünmedi.
```

Bu yüzden:

```text
FAZ 1-02 = In Progress
Done değil.
```

Bu modül kapanmadan sistem “terapist gerçekten çalışıyor mu?” sorusunu güvenli cevaplayamaz.

---

# 6. Staff_Shift_Patterns / Sonsuz Vardiya Planlama

Ana tablo:

```text
Staff_Shift_Patterns
```

Görev:

```text
Her gün elle vardiya girmemek.
Terapistin haftalık/aylık vardiya şablonunu oluşturmak.
Gelecek 90/180/365 gün Staff_Shifts üretmek.
```

Kritik alanlar:

```text
Pattern Name
Staff_Link
Location_Link
Weekdays
Default_Shift_Start
Default_Shift_End
Pattern_Status
Effective_From
Effective_Until
Planning_Horizon_Days
Auto_Generate
Last_Generated_Until
Timezone
Slot_Minutes
Tenant_Link
```

Doğru kullanım:

```text
Staff_Shift_Patterns = plan şablonu
Staff_Shifts = canlı scheduler gerçeği
```

Yani resepsiyon **Staff_Shift_Patterns** ile çalışmaz; resepsiyon **Staff_Shifts** ile çalışır.

---

# 7. Rezervasyon Omurgası

Ana tablo:

```text
Bookings
```

Bu sistemin kalbidir.

Bookings tablosu çok güçlü ama çok kalabalık. Bu yüzden resepsiyon kullanıcıları raw table görmemeli; Interface üzerinden sade görünüm görmeli.

## Bookings kaynak gerçekleri

Kanonik saat alanları:

```text
Start_DateTime
Calculated_Finish_DateTime
Reception Time Display
Effective Duration Minutes
Therapist Next Available Time
```

Kural:

```text
Start_DateTime = gerçek başlangıç
Calculated_Finish_DateTime = gerçek bitiş
Reception Time Display = sadece ekranda okunacak format
Reception Calendar Start = teknik yardımcı, resepsiyonda görünmemeli
```

## Bookings müşteri/hizmet/personel alanları

```text
Client_Link
Service_Link
Therapist_Link
Room_Link
Location_Link
Tenant_Link
```

## Bookings durum alanları

```text
Status_New
Payment_Status_New
Payment Method
Reception Ready Status
Reception Ready Reason
Calendar_Readiness
Scheduler Live Clean Check
Conflict_Status
Conflict_Type
Conflict ⚠️
Therapist Shift Gate
```

## Bookings finans alanları

```text
Total_Amount_EUR_New
Total Paid EUR
Balance_Due_EUR
Discount EUR
Payment/Coverage Source
Client Package Link
Sessions To Deduct
Payment Closure Status
```

## Bookings paket alanları

```text
Client Package Link
Sessions To Deduct
Package_Usage_Ledger
Ledger Created?
Package Ledger Ready Check
Package Ledger Auto Trigger
```

## Bookings stok alanları

```text
Inventory_Deducted
Inventory_Transactions
```

## Bookings komisyon alanları

```text
Commission_Ledger_Link
Commission_Calculated
```

## Bookings legacy / gizlenmesi gereken alanlar

Günlük resepsiyon görmemeli:

```text
Booking_Date
Start_Time
End_Time
Start Time
End Time
Finish_DateTime
Temp_Start_DateTime_Parse
Temp_Finish_DateTime_Parse
Legacy_Client_Text
Legacy_Service_Collaborator
Legacy_Therapist_Select
Legacy_Room_File
Attachment Summary
Internal_Notes_New
Deposit_Paid
Reception Calendar Start
Field 61
Field 62
```

Silinmemeli; sadece gizlenmeli.

---

# 8. Reception Daily Board Katmanı

Interface:

```text
Resepsiyon Günlük Operasyon
```

Ana sayfalar:

```text
Santis Club — Reception Day Board
Santis Club — Open Live Bookings
Santis Club — Budva — Live Reception Today
Santis Club — Podgorica — Live Reception Today
Santis Club — Kotor — Live Reception Today
Santis Club — Tivat — Live Reception Today
Santis Club — Antalya — Live Reception Today
Check-in Queue
Unpaid / Deposit Queue
Reception Action Center
Reception Task Queue
Inventory Live Stock
End of Day Closing sayfaları
```

Şu an görülen durum:

```text
Interface var.
Reception Day Board var.
Şube bazlı live reception sayfaları var.
Ama bazı sayfalarda teknik/AI alanları görünüyor.
```

Eksik / düzeltilmesi gereken:

```text
Reception Day Board alan standardı tam değil.
Attachment Summary ve Internal_Notes_New günlük resepsiyonda görünmemeli.
Booking ID, Start_DateTime, Calculated_Finish_DateTime, Location_Link,
Total Paid EUR, Balance_Due_EUR, Reception Ready Status,
Reception Ready Reason, Therapist Next Available Time, Conflict ⚠️,
Reception_Notes, Environment görünmeli.
```

Bu yüzden:

```text
FAZ 1-01 = In Progress
Bilgisayar bekliyor
Done değil
```

---

# 9. Ödeme Katmanı

Ana tablo:

```text
Payments
```

Bookings ile farkı:

```text
Bookings = rezervasyonun hızlı ödeme görünümü
Payments = gerçek para hareketi
```

Payments tablosu gerçek parayı izler:

```text
Cash
Card
Bank Transfer
Deposit
Partial payment
Full payment
Refund
Discount
Tip
```

Kritik alanlar:

```text
Payment Name
Booking_Link
Location_Link
Amount_EUR
Method
Payment_Status_New
Payment_Date
Environment
Discount_Amount
Tip
Gross_Amount_EUR
Refund_Amount_EUR
Net_Amount_EUR
Display Amount
Payment Currency
FX Rate Snapshot
Accounting Amount
Cash Register Date
Tenant_Link
Cash_Movements
Commission Ledger
```

Doğru kural:

```text
Unpaid booking için Payments kaydı şart değildir.
Gerçek para alındığında Payments kaydı oluşmalı.
Paket kullanımı normal cash/card payment gibi yazılmamalı.
```

Faz 1 borcu:

```text
FAZ 1-03 — Booking ödeme kapanış akışı
Status: To Do
```

Kapanış için test lazım:

```text
1 cash booking
1 card booking
1 unpaid/partial booking
```

---

# 10. Kasa / Gün Sonu Kapanış Katmanı

Ana tablolar:

```text
Cash_Register
Cash_Movements
Daily_Cash_Closing
Revenue_Dashboard
```

## Cash_Register

Kasa hesabı tanımıdır.

```text
Budva Cash Register
Podgorica POS
Bank account
Reception cash drawer
```

Kritik alanlar:

```text
Cash Register Name
Tenant_Link
Location_Link
Register Type
Currency
Opening Balance
Status
Environment
```

## Cash_Movements

Gerçek kasa hareketi defteridir.

```text
Gelir
Gider
Transfer
Correction
Opening Balance
Closing Adjustment
```

Kritik alanlar:

```text
Movement ID
Tenant_Link
Location_Link
Environment
Movement Date
Movement Type
Category
Cash_Register_Link
Payment_Link
Booking_Link
Amount
Method
Direction
Approval Status
Daily_Cash_Closing
```

## Daily_Cash_Closing

Gün sonu kasa kapanış defteridir.

Kritik alanlar:

```text
Closing ID
Tenant_Link
Location_Link
Environment
Closing Date
Cash_Register_Link
Cash_Movements_Link
Opening Cash
Cash Income
Card Income
Bank Income
Expenses
Transfers In
Transfers Out
Cash Counted
Total Income
Expected Cash
Cash Difference
Closing Status
Manager Approval
Approved By
Approved At
Approval Notes
```

Doğru kural:

```text
Cash Difference ≠ 0 ise direkt Approved olmamalı.
Review Needed veya Ready for Review olmalı.
```

Faz 1 borcu:

```text
FAZ 1-04 — Daily_Cash_Closing gün sonu kasa testi
Status: To Do
```

---

# 11. Paket Sistemi

Doğru zincir:

```text
Package_Catalog
↓
Client_Packages
↓
Package_Usage_Ledger
↓
Bookings
```

Eski tablo:

```text
ARCHIVED_Packages_Legacy_DO_NOT_USE
```

Bu kullanılmayacak. Silinmeyecek, sadece arşiv/history.

## Package_Catalog

Satılabilir paket şablonudur.

```text
Package Name
Category
Package Price EUR
Total Duration Minutes
Total_Sessions
Validity_Days
List_Price_EUR
Unit_Value_EUR
Active
Tenant_Link
Environment
```

## Client_Packages

Müşterinin satın aldığı paket cüzdanıdır.

```text
Client
Catalog_Link
Purchase Date
Start Date
Expiry Date
Total Sessions
Used Sessions Rollup
Remaining Sessions
Package Price EUR
Paid Amount EUR
Payment Status
Package Status
Package Balance Status
Package Expiring Alert
Low Balance Alert
Tenant_Link
Environment
```

## Package_Usage_Ledger

Her paket kullanımı burada izlenir.

```text
Usage ID
Usage Date
Client
Client_Package_Link
Booking
Service
Therapist
Location
Sessions Deducted
Deductible Sessions
Realized Session Value EUR
Commission Eligible
Commission Base EUR
Environment
Tenant_Link
```

Doğru kural:

```text
Bir paketli booking tamamlandığında tam 1 ledger kaydı oluşmalı.
Ledger Created? duplicate engellemek için kullanılmalı.
```

Bu Faz 2/P2 konusu. Faz 1 bitmeden derine girilmemeli.

---

# 12. Stok / Envanter Sistemi

Ana tablolar:

```text
Inventory
Inventory_Transactions
Service Consumption Rules
Suppliers
```

## Inventory

Ürün/stok ana kartıdır.

```text
Item Name
Supplier
Category
Current Stock
Reorder Level
Stock Status
Unit Cost
Sale Price
Stock Value
Location Link
Reorder Signal Created?
Inventory Reorder Signal Ready
Restock Reset Ready
Tenant_Link
Environment
```

## Service Consumption Rules

Hizmet reçetesidir.

Örnek:

```text
Deep Tissue Massage → 20 ml oil
Hamam Ritual → 1 towel + soap
Facial Care → cream + mask
```

Alanlar:

```text
Rule Name
Service_Link
Inventory_Link
Location_Link
Quantity Used
Unit
Trigger Event
Active
```

## Inventory_Transactions

Her stok hareketi burada izlenir.

```text
Item
Date
Type
Quantity Change
Booking_Link
Payment_Link
Service_Link
Location_Link
Transaction_Source
Created_By_Automation
Transaction_Status
Tenant_Link
Environment
```

Doğru zincir:

```text
Booking Completed
↓
Service Consumption Rules okunur
↓
Inventory_Transactions oluşturulur
↓
Inventory Current Stock düşer
↓
Stock düşükse Task oluşur
```

Bu Faz 2/P2 geliştirme.

---

# 13. Komisyon Sistemi

Doğru zincir:

```text
Commission Rules
↓
Commission Ledger
```

Eski/geçiş tabloları:

```text
Therapist_Commissions_v2
Reception_Commissions
ARCHIVED_Therapist_Commissions_v1
```

Bunlar rapor/geçiş için tutulur ama yeni sistemin ana ödeme kaynağı olmamalı.

## Commission Rules

Komisyon kural motorudur.

```text
Rule Name
Commission Target
Trigger Event
Calculation Type
Rate Percent
Fixed Amount EUR
Active
Service_Link
Location_Link
Tenant_Link
```

## Commission Ledger

Gerçek kazanılmış komisyon defteridir.

```text
Commission Entry
Commission Type
Source Event
Gross Source Amount EUR
Commission Amount EUR
Payout Status
Entry Date
Booking_Link
Payment_Link
Therapist_Link
Reception_Staff_Link
Service_Link
Location_Link
Commission_Rule_Link
Tenant_Link
Environment
```

Doğru kural:

```text
Kural Commission Rules’ta tanımlanır.
Gerçek kazanım Commission Ledger’a yazılır.
```

Bu Faz 2/P2 konusu.

---

# 14. CRM / Misafir Hafızası

Ana tablolar:

```text
Clients
Client_Notes
Guest Memory
CRM_Signals
Loyalty_Profiles
VIP_Concierge_Engine
Leads
Tasks
```

## Clients

Müşteri kimlik tablosu.

Günlük resepsiyon alanları:

```text
Full Name
Phone
Email
Language
VIP_Status
Preferences
Allergies
Notes
Bookings
Client_Notes
Environment
Tenant_Link
```

Gizlenecek / ikincil alanlar:

```text
Attachments
Attachment Summary
Memberships
Gift_Cards
Leads
Packages
Tasks
Sistemsel bağlantılar
```

## Client_Notes

Tarihsel müşteri not defteri.

Kategoriler:

```text
Tıbbi/Alerji
Tercih
Şikayet
VIP Not
Genel
```

Kritik alanlar:

```text
Client_Link
Booking_Link
Category
Note_Content
is_alert
alert_priority
```

## Guest Memory

Lüks misafir hafızası.

```text
Preferred Pressure
Language
Allergy Notes
VIP Notes
Churn Risk
Loyalty Score
Next Best Offer
Next Best Ritual
Favorite Therapist
Favorite Service
Birthday
Environment
Client_Link
```

## CRM_Signals

Aksiyon üretir.

```text
Birthday
Package Expiring
Membership Renewal
VIP Upgrade
Winback
Upsell
Cross Sell
Retention Risk
Package Follow-up
```

Bu sistem ileride “Santis Concierge” ve “Guest 360” ekranının temelidir.

Faz 1’den sonra geliştirilir.

---

# 15. Görev / Operasyon Aksiyon Sistemi

Ana tablo:

```text
Tasks
```

Görevler burada toplanır.

Kritik alanlar:

```text
Task Title
Priority
Status
Due Date
Related Client
Related Booking
Related Payment
Related Inventory Item
Tenant_Link
Location_Link
Environment
```

Şu an Faz 1 görevleri:

```text
FAZ 1-01 — Reception Daily Board sade görünüm kontrolü
FAZ 1-02 — Bugünkü Staff_Shifts / terapist vardiya kontrolü
FAZ 1-03 — Booking ödeme kapanış akışı kontrolü
FAZ 1-04 — Daily_Cash_Closing gün sonu kasa testi
FAZ 1-05 — Live/Test/Archive filtre güvenliği kontrolü
FAZ 1-06 — Offline günlük PDF/XLSX yedek kontrolü
```

Durum:

```text
FAZ 1-01 = In Progress
FAZ 1-02 = In Progress
FAZ 1-03 = To Do
FAZ 1-04 = To Do
FAZ 1-05 = In Progress
FAZ 1-06 = In Progress
```

---

# 16. Backup / Offline Katmanı

Ana tablolar:

```text
Backup_Offline_Log
Offline_Daily_Schedule_Exports
```

## Backup_Offline_Log

Genel backup defteri.

```text
Backup_Title
Backup_Date
Backup_Type
Status
Performed_By_Text
Storage_Location
Verified
Tenant_Link
Location_Link
```

## Offline_Daily_Schedule_Exports

Günlük offline program çıktısı.

```text
Export Name
Export Date
Run Time
Export Status
PDF File
Excel File
Source Filter
Included Sections
Output Notes
```

Doğru kural:

```text
Her sabah resepsiyon açılmadan önce bugünkü program PDF + Excel/CSV olarak ikinci güvenli yere konmalı.
```

Şu anki borç:

```text
Bugün için Offline_Daily_Schedule_Exports kaydı bulunmadı.
FAZ 1-06 = In Progress / borç var.
```

Bu kritik; internet giderse resepsiyon hazırlıksız kalır.

---

# 17. Governance / Kilit / Teknik Borç Katmanı

Ana tablolar:

```text
Live_Operation_Lock
Technical_Debt_Ledger
Boardroom Decisions
SaaS_Module_Integration_Map
```

## Live_Operation_Lock

Canlı operasyon kilit defteri.

Amaç:

```text
Bir modül Locked olmadan canlı güvenli kabul edilmez.
```

Katmanlar:

```text
Data Integrity
Reception Workflow
Payments & Closing
Packages
Inventory
Backup & Offline
Branch / Staff
Interface
Governance
```

Durum örneği:

```text
LOCK-17 — Booking Therapist Shift Gate = Ready for Test
LOCK-20 — Booking Staff Shifts Live Matching Engine = Blocked
```

En kritik kilit borcu:

```text
/reception/shifts endpoint eksik.
Staff_Shifts canlı matching tam kapanmamış.
```

## Technical_Debt_Ledger

Teknik borç defteri.

Açık önemli borçlar:

```text
90 ADMIN view overload for daily reception users
Airtable admin views not integrated with Santis web admin
Faz 2-F Interface / View Lock manual implementation
```

Kapalı ama dikkat isteyen alanlar:

```text
Bookings field overload
Reception interface not finalized
Environment not universal
Live payment closure open
Legacy field exposure risk
Dashboard Live filter governance
Timezone field conflict
Package model duplication
Commission ledger duplication
```

Not:

```text
Closed = governance olarak kapanmış olabilir.
Operasyonel test yine de gerekebilir.
```

---

# 18. Interface / Kullanıcı Ekranı Haritası

## Aktif interface grubu

```text
Resepsiyon Günlük Operasyon
```

Sayfalar:

```text
Reception Task Queue
Reception Day Board
Open Live Bookings
Budva Live Reception Today
Podgorica Live Reception Today
Kotor Live Reception Today
Tivat Live Reception Today
Antalya Live Reception Today
Check-in Queue
Unpaid / Deposit Queue
Reception Action Center
Inventory Live Stock
Budva End of Day Closing
Podgorica End of Day Closing
Kotor End of Day Closing
Tivat End of Day Closing
Antalya End of Day Closing
General End of Day Closing
```

## Ayrı interface

```text
End of Day Closing
```

Dashboard elemanları:

```text
Cash Income
Expected Cash
Cash Counted
Cash Difference
Daily Closing Records
Cash Movements Detail
```

Güçlü taraf:

```text
Resepsiyon, ödeme, check-in, unpaid queue ve end-of-day ekranları kurulmuş.
```

Zayıf taraf:

```text
Bazı ekranlarda teknik alanlar hâlâ görünüyor.
Alan sıraları masaüstünden sadeleştirilmeli.
Filtreler masaüstünden tek tek doğrulanmalı.
```

---

# 19. Santis OS Veri Akış Haritası

## Normal rezervasyon akışı

```text
Client seçilir
↓
Service seçilir
↓
Therapist seçilir
↓
Room seçilir
↓
Location belirlenir
↓
Start_DateTime girilir
↓
Duration hesaplanır
↓
Calculated_Finish_DateTime oluşur
↓
Reception Ready Status kontrol edilir
↓
Conflict / Shift Gate kontrol edilir
↓
Booking Confirmed olur
```

## Ödeme akışı

```text
Booking tamamlanır veya ödeme alınır
↓
Payment Method seçilir
↓
Payment_Status_New güncellenir
↓
Gerçek para varsa Payments kaydı oluşur
↓
Cash/Card ayrımı yapılır
↓
Cash_Movements’a kasa izi düşer
↓
Daily_Cash_Closing kapanışında görünür
```

## Paket akışı

```text
Package_Catalog paket şablonu
↓
Client_Packages müşteri paket cüzdanı
↓
Booking paket ile kapatılır
↓
Package_Usage_Ledger seans düşer
↓
Remaining Sessions güncellenir
↓
Low Balance / Expiry CRM signal üretilebilir
```

## Stok akışı

```text
Booking Completed
↓
Service Consumption Rules okunur
↓
Inventory_Transactions oluşur
↓
Inventory Current Stock düşer
↓
Reorder Needed ise Task oluşur
```

## Komisyon akışı

```text
Booking / Payment / Package Usage tamamlanır
↓
Commission Rules kontrol edilir
↓
Commission Ledger kaydı oluşur
↓
Payout Status takip edilir
```

## CRM akışı

```text
Client davranışı / paket / doğum günü / risk oluşur
↓
CRM_Signals oluşur
↓
Reception Action Center’da görünür
↓
Guest Memory güncellenir
↓
Next Best Action belirlenir
```

---

# 20. Sistem Kaynak Gerçekleri

Bu alanlar “source of truth” kabul edilmeli:

```text
Tenant gerçekliği: Tenants
Şube gerçekliği: Locations
Personel kimliği: Therapists
Canlı vardiya gerçekliği: Staff_Shifts
Hizmet gerçekliği: Services
Oda gerçekliği: Rooms
Rezervasyon gerçekliği: Bookings
Gerçek para hareketi: Payments
Kasa hareketi: Cash_Movements
Gün sonu kapanışı: Daily_Cash_Closing
Paket şablonu: Package_Catalog
Müşteri paket cüzdanı: Client_Packages
Paket kullanım defteri: Package_Usage_Ledger
Stok gerçekliği: Inventory
Stok hareketi: Inventory_Transactions
Komisyon kuralı: Commission Rules
Komisyon ödeme defteri: Commission Ledger
Müşteri kimliği: Clients
Misafir hafızası: Guest Memory + Client_Notes
CRM aksiyonları: CRM_Signals
Backup kanıtı: Backup_Offline_Log + Offline_Daily_Schedule_Exports
Canlı kilit: Live_Operation_Lock
Teknik borç: Technical_Debt_Ledger
```

---

# 21. En Kritik Açık Borçlar

## P0 — Canlı vardiya borcu

```text
Bugünkü canlı Santis Club Staff_Shifts görünmüyor.
Sadece QA/demo vardiya kaydı bulundu.
```

Etki:

```text
Terapist gerçekten bugün çalışıyor mu?
Rezervasyon vardiya içinde mi?
Canlı scheduler güvenli mi?
```

Bu sorular tam kapanmıyor.

## P0 — Ödeme kapanış testi yapılmadı

```text
FAZ 1-03 = To Do
```

Etki:

```text
Paid / Partial / Unpaid / Package ödeme akışı canlı test edilmedi.
```

## P0 — Gün sonu kasa testi yapılmadı

```text
FAZ 1-04 = To Do
```

Etki:

```text
Cash Income
Expected Cash
Cash Counted
Cash Difference
Manager Approval
```

zinciri test edilmedi.

## P1 — Reception Interface sade değil

```text
FAZ 1-01 = In Progress
```

Etki:

```text
Resepsiyon teknik alanları görebilir.
Yanlış alanı düzenleme riski var.
```

## P1 — Live/Test/Archive filtreleri masaüstü doğrulama istiyor

```text
FAZ 1-05 = In Progress
```

Etki:

```text
Test veya Archive kayıtlar resepsiyon ekranına karışabilir.
```

## P1 — Offline PDF/XLSX export yok

```text
FAZ 1-06 = In Progress
```

Etki:

```text
İnternet giderse günlük programın güvenli offline kopyası yok.
```

---

# 22. Fazlara Göre Geliştirme Haritası

## Faz 1 — Canlı Resepsiyon

Kapsam:

```text
Reception Daily Board
Staff_Shifts
Booking payment closure
Daily_Cash_Closing
Live/Test/Archive guard
Offline PDF/XLSX backup
```

Öncelik:

```text
Önce resepsiyon çalışsın.
Sonra paket/stok/komisyon/CRM.
```

## Faz 2 — Paket + Stok + Komisyon

Kapsam:

```text
Package_Catalog
Client_Packages
Package_Usage_Ledger
Inventory
Inventory_Transactions
Service Consumption Rules
Commission Rules
Commission Ledger
```

## Faz 3 — CRM / Guest Memory

Kapsam:

```text
Clients
Client_Notes
Guest Memory
CRM_Signals
Loyalty_Profiles
VIP_Concierge_Engine
Leads
Tasks
```

## Faz 4 — Admin Panel API Bridge

Kapsam:

```text
Airtable → Backend API → Santis Admin Panel
/reception/bookings/today
/reception/shifts
/reception/payments
/reception/closing
```

Kural:

```text
Airtable token browser’a konmaz.
Sadece backend tarafında kalır.
```

## Faz 5 — PostgreSQL / FastAPI / React SaaS

Kapsam:

```text
Airtable canlı operasyon
↓
PostgreSQL ana arşiv / güçlü veri tabanı
↓
React Admin Panel
↓
FastAPI / Node backend
↓
Çok şubeli SaaS
```

---

# 23. Hangi Modüller Şimdi Geliştirilmeli?

Doğru sıra:

```text
1. Staff_Shifts / canlı terapist vardiya
2. Offline Daily Schedule / PDF-XLSX yedek
3. Booking Payment Closure
4. Daily_Cash_Closing
5. Reception Daily Board sade interface
6. Live/Test/Archive filtre doğrulaması
7. Admin Panel API Bridge
8. Package Usage Ledger
9. Inventory Deduction
10. Commission Ledger
11. CRM / Guest Memory
```

Bugün bilgisayar yokken sadece kontrol:

```text
Staff_Shifts’te bugünkü canlı vardiyalar var mı?
Offline_Daily_Schedule_Exports’ta bugünkü export var mı?
Reception ekranında Test/QA/Archive kayıt görünüyor mu?
```

Bilgisayarda yapılacak:

```text
Interface alan düzeni
Filtre doğrulaması
Vardiya toplu giriş/import
CSV/PDF/XLSX export
Ödeme/kasa testleri
Otomasyon kurulumu
```

---

# 24. Sonuç

Santis OS’un mevcut haritası şöyle özetlenir:

```text
Airtable = canlı operasyon omurgası
Bookings = rezervasyon kalbi
Staff_Shifts = canlı takvim güvenliği
Payments = gerçek para
Cash_Movements = kasa izi
Daily_Cash_Closing = gün sonu mühürü
Package_Catalog + Client_Packages + Package_Usage_Ledger = paket sistemi
Inventory + Consumption Rules = stok zekâsı
Commission Rules + Commission Ledger = prim sistemi
Clients + Guest Memory + CRM_Signals = lüks müşteri hafızası
Live_Operation_Lock + Technical_Debt_Ledger = yönetim ve güvenlik katmanı
Tenants + Feature_Access + Subscriptions = gelecekte SaaS katmanı
```

Net karar:

```text
Sistem doğru yönde.
Veri modeli artık ciddi seviyede.
Faz 1 henüz kapanmadı.
Kapanış için ana borçlar:
1. canlı Staff_Shifts,
2. ödeme/kasa kapanış testi,
3. offline export,
4. interface sadeleştirme.
```

Bu harita üzerinden artık her modül tek tek “Done / In Progress / Blocked” olarak yönetilebilir.
