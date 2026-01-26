# 🔐 GÜVENLİK NOTLARI

## ⚠️ ÖNEMLİ: API Key'ler

### `.env` Dosyası
- **ASLA GIT'E PUSH ETMEYİN!**
- `.gitignore` içinde korunuyor
- Her geliştirici kendi `.env` dosyasını oluşturmalı

### Yeni Ekip Üyesi Setup:
1. `.env.example` dosyasını `.env` olarak kopyala
2. Kendi API key'lerini ekle
3. **`.env` dosyasını paylaşma** (email, chat vb.)

---

## 📋 API Key Nereden Alınır?

### Gemini API
- URL: https://aistudio.google.com/app/apikey
- Ücretsiz tier: 1,500 request/ay
- Format: `AIzaSy...`

### Stripe (Ödeme)
- URL: https://dashboard.stripe.com/apikeys
- Test mode: `sk_test_...`
- Live mode: `sk_live_...`

### Mollie (Ödeme - EU)
- URL: https://www.mollie.com/dashboard/developers/api-keys
- Test mode: `test_...`
- Live mode: `live_...`

---

## 🚨 API Key Sızdı mı?

### Acil Adımlar:
1. **Hemen key'i iptal et** (provider dashboard'dan)
2. Yeni key oluştur
3. `.env` dosyasını güncelle
4. **GIT geçmişini temizle:**
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
   ```

---

## ✅ Güvenli Deployment

### Production'da:
- `.env` dosyası **sunucuda sadece**
- Environment variables kullan
- Secret management (AWS Secrets Manager, Vercel vb.)

### Asla commit etme:
- ❌ `.env`
- ❌ API keys
- ❌ Database passwords
- ❌ Private keys
- ❌ Üyelerin kişisel bilgileri

---

**Son kontrol:** 
```bash
git status
```
`.env` dosyası listede **GÖRÜNMEMELI**!
