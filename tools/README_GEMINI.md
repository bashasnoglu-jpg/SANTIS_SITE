# Santis Club - Gemini API Entegrasyonu

## Kurulum

1. **Gerekli paketleri yükleyin:**
```bash
pip install google-generativeai python-dotenv
```

2. **API Key alın:**
- [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz API key alın
- `.env.example` dosyasını `.env` olarak kopyalayın
- API key'inizi `.env` dosyasına ekleyin

3. **Kullanım:**

### Ürünleri 5 dile çevir:
```bash
python tools/gemini_translate.py --mode translate
```

Output:
- Tüm ürünlerin `name` ve `desc` alanlarını TR → EN, DE, FR, RU'ya çevirir
- Otomatik backup oluşturur (`_backups/` klasöründe)
- Mevcut çevirileri atlar (tekrar çevrilmez)

### İçerikleri zenginleştir:
```bash
python tools/gemini_translate.py --mode enrich
```

Output:
- Her ürüne `benefits`, `usage`, `ingredients_highlight` ekler
- Premium spa tonu korur

## Maliyet Tahmini

**50 ürün için:**
- Input: ~25K token (~$0.03)
- Output: ~100K token (~$1.00)
- **Toplam: ~$1-2** (tek seferlik)

## Özellikler

✅ Otomatik backup
✅ Rate limiting (1 saniye bekleme)
✅ Hata yönetimi
✅ Quiet luxury ton koruma
✅ Mevcut çevirileri atlama
✅ JSON format validation

## Örnek Çıktı

```json
{
  "id": "p_001",
  "name": {
    "tr": "Savon Noir - Okaliptüs",
    "en": "Black Soap - Eucalyptus",
    "de": "Schwarze Seife - Eukalyptus",
    "fr": "Savon Noir - Eucalyptus",
    "ru": "Черное мыло - Эвкалипт"
  },
  "desc": {
    "tr": "Geleneksel hamam ritüeli için özel formül",
    "en": "Traditional hammam ritual formula",
    "de": "Traditionelle Hammam-Ritual-Formel",
    "fr": "Formule rituel hammam traditionnel",
    "ru": "Традиционная формула хаммама"
  },
  "benefits": [
    "Deep cleansing ritual",
    "Natural eucalyptus essence",
    "Premium spa experience"
  ],
  "usage": "Apply to damp skin, massage gently...",
  "price": 59
}
```

## Notlar

- Script `assets/js/db.js` dosyasını direkt günceller
- Her çalıştırmadan önce otomatik backup alır
- Gemini 2.0 Flash modeli kullanır (en ucuz + hızlı)
- Rate limiting 1 req/saniye (değiştirilebilir)
