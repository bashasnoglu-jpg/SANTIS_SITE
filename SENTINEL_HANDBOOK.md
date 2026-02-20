
# 📘 SİSTEM KİMLİK KARTI: SANTIS SENTINEL V3 ULTRA

> **"Sistemi koruyan, iyileştiren ve geleceği gören otonom siber varlık."**

---

## 1. GENEL BAKIŞ
**Santis Sentinel**, web sitesinin sağlığını 7/24 izleyen, hataları tespit edip (güvenliyse) otomatik onaran, performans trendlerini analiz eden ve yöneticiye stratejik danışmanlık veren yapay zeka destekli bir operasyon sistemidir.

* **Versiyon:** V3 Ultra (Reactive + Predictive + Advisory)
* **Rol:** Autonomous Web Operations Agent
* **İnsan Rolü:** Supervisor (Gözetmen) & Onaylayıcı

---

## 2. YETENEKLER (Capabilities)

### 🛡️ 1. KORUMA (Protection)
* **Sensörler:** `audit_crawler.py` (Linkler/Assets), `visual_audit.py` (Görsel Bütünlük), `security_audit.py` (Güvenlik Açıkları).
* **Aksiyon:** Kritik hatalar (örn. 500 hatası, eksik dosya) anında tespit edilir.

### 🔧 2. ONARIM (Self-Healing)
* **Auto-Fixer:** `auto_fixer.py` basit ve hatasız çözümleri (örn. eksik CSS, kırık görsel yolu) otomatik uygular.
* **Loop Protection:** Aynı hatayı sürekli düzeltmeye çalışmaz. 3 kez başarısız olursa durur ve insanı çağırır.

### 🔮 3. KAHİNLİK (Prediction)
* **Trend Analizi:** `sentinel_analytics.py` sistemin hızını ve sağlığını zaman içinde takip eder.
* **Erken Uyarı:** Henüz hata yokken bile "Sistem %20 yavaşladı" veya "Sağlık puanı düşüyor" uyarısı verir.

### 🧠 4. DANIŞMANLIK (Advisory)
* **AI Suggestions:** `ai_suggestions.py` sistem verilerini analiz edip "Cache aç", "Görselleri sıkıştır" gibi optimizasyon önerileri sunar.

### 🗣️ 5. SES (Voice)
* **Notifier:** `sentinel_notifier.py` kritik durumlarda Discord (Webhook) veya Log üzerinden sesli uyarı verir.

---

## 3. MİMARİ HARİTA (Architecture Map)

```mermaid
graph TD
    A[SENSORS] -->|Data| B(BRAIN & MEMORY)
    B -->|Analysis| C{DECISION}
    
    C -->|Safe Fix| D[HANDS: Auto-Fixer]
    C -->|Risk/Unknown| E[VOICE: Notifier]
    C -->|Trend/Optimization| F[ADVISOR: Suggestions]
    
    subgraph SENSORS
    S1[Audit Crawler]
    S2[Visual Audit]
    S3[Security Audit]
    end
    
    subgraph BRAIN
    B1[Sentinel Analytics]
    B2[AI Suggestions]
    B3[Memory (JSON)]
    B4[Metrics (Time-Series)]
    end
```

---

## 4. OPERASYON PROSEDÜRLERİ (Runbook)

### 🚨 Durum: Sentinel "CRITICAL ALERT" Veriyor
1. **Admin Panele Git:** "Sentinel" sekmesini aç.
2. **Mesajı Oku:** Hata sistemsel mi (kod hatası) yoksa operasyonel mi (sunucu düştü)?
3. **Müdahale Et:** Sentinel'in yetkisini aşan bir durumdur. Manuel düzeltme gerekir.

### ⚠️ Durum: "PREDICTIVE RISK" Uyarısı
1. **Trendlere Bak:** "Predictive Trends" grafiğinde oklar ne yöne bakıyor? (↗️ Yavaşlama mı?)
2. **Önerileri İncele:** "AI Suggestions" kısmında Sentinel ne öneriyor? (Örn. "Cache aç")
3. **Planla:** Acil değildir ama yakında sorun çıkarabilir. Bir sonraki bakımda düzelt.

### 🔄 Durum: Sentinel "LOOP DETECTED" Diyor
1. **Anlamı:** Sentinel bir sorunu çözmeye çalıştı ama sorun tekrar etti.
2. **Aksiyon:** O sorunu manuel çözmelisin. Sentinel "zarar vermemek için" durmuştur.

---

## 5. DOSYA YAPISI
* `sentinel.py`: **Ana Beyin.** Döngüyü yönetir.
* `sentinel_memory.py`: **Hafıza.** Olayları kaydeder.
* `sentinel_analytics.py`: **Analiz.** Trendleri yorumlar.
* `sentinel_notifier.py`: **Ses.** Bildirim atar.
* `auto_fixer.py`: **Eller.** Düzeltme yapar.
* `ai_suggestions.py`: **Danışman.** Öneri sunar.
* `reports/`: Tüm loglar ve metrikler burada.

---

## 6. SON SÖZ
Santis Sentinel, sitenizi siz uyurken bile bekleyen dijital bir muhafızdır. Ona güvenin ama kontrolü bırakmayın.

**"Trust, but Verify."**
