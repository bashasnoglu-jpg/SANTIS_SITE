# SANTIS OS — LIVE KAYITLAR OPERASYON ANALİZİ

Airtable `Bookings` tablosundaki yalnızca `Environment = Live` olan kayıtlar analiz edilmiş ve Test/Archive verileri dışarıda bırakılmıştır.

## 1. LIVE_CRITICAL (Operasyona Hazır Olmayanlar)
> Tüm Live kayıtlar Daily Reception için 'Ready' görünüyor.

## 2. LIVE_PAYMENT_GAPS (Ödeme Eksikleri ve Sorunları)
| Booking ID | Reception Time Display | Client | Service | Therapist | Room | Location | Status_New | Payment_Status_New | Sorun | Önerilen güvenli düzeltme |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 33 | 09:00–10:00 - Anna Müller - Mandara Massage (4 Hand) - DEVRİM - Budva Couple Room | rec0CehPDrNyQml3i | rec08WWRBYl8a83GN | rec3LYMrh77c87vnj | recTop4Dehpy7dKkI | rec1qC31hFqbuLHZU | Confirmed | Unpaid | Ödeme tamamlanmamış (Mevcut: Unpaid) | Misafir işlemi tamamlandığında tahsilat kontrolü yapın. |
| 28 | 13:00–13:50 - Mehmet Öz - Relax Massage - ZAHİDE - Budva Massage Room 4 | rec1fJNUgzTNCvlk2 | recdDhG02BciOT9nN | recClzUcFGJpPGNl7 | recD6pvi0ZivCO0HK | rec1qC31hFqbuLHZU | Confirmed | Deposit Paid | Ödeme tamamlanmamış (Mevcut: Deposit Paid) | Misafir işlemi tamamlandığında tahsilat kontrolü yapın. |
| 36 | 15:44–16:44 - Anna Müller - Deep Tissue Massage - ŞABAN - Budva Massage Room 1 | rec0CehPDrNyQml3i | recFk6MDikfaDeTmv | recNnugIfgZGAUpSy | recpjMJZLsuEdM9zM | rec1qC31hFqbuLHZU | Draft | Unpaid | Ödeme tamamlanmamış (Mevcut: Unpaid) | Misafir işlemi tamamlandığında tahsilat kontrolü yapın. |
| 31 | 16:00–16:50 - Anna Müller - Eye Care Active Couture - BELA - Tivat Facial Room 1 | rec0CehPDrNyQml3i | rec9lUC9DuUgnhYEY | recoIcC9OoHvT20f8 | recAXBwwIzORwgh5h | recOPZ698pht6RHc5 | Checked-in | Unpaid | Ödeme tamamlanmamış (Mevcut: Unpaid) | Misafir işlemi tamamlandığında tahsilat kontrolü yapın. |
| 34 | 10:00–10:50 - Mehmet Öz - Classic Full Body Massage - ARZU - Budva Couple Room | rec1fJNUgzTNCvlk2 | rec4xrJEW1tOHXnhj | rec4UaeE7vHXWgJcV | recTop4Dehpy7dKkI | rec1qC31hFqbuLHZU | Confirmed | Unpaid | Ödeme tamamlanmamış (Mevcut: Unpaid) | Misafir işlemi tamamlandığında tahsilat kontrolü yapın. |

## 3. LIVE_ASSIGNMENT_GAPS (Eksik Atamalar)
> Tüm Live kayıtların terapist ve oda ataması tamamlanmış.

