# Santis OS API Key Governance Seal

## Principle

API anahtarları sohbet içinde paylaşılmamalı, kaynak koda gömülmemeli ve frontend tarafına hiçbir koşulda taşınmamalıdır.

Yanlışlıkla sohbet, issue, log, terminal çıktısı veya commit içinde görünen bir anahtar derhal iptal edilmeli ve yenisi oluşturulmalıdır.

## Approved Flow

```txt
.env / Secret Manager
  ↓
server-side runtime
  ↓
process.env.OPENAI_API_KEY
  ↓
Aurelia Whisper Engine
  ↓
SovereignDiarist / Oracle Layer
```

## Forbidden Surfaces

```txt
sovereign_archive_v28.html
frontend JavaScript
client-side bundles
Git commits
console logs
browser localStorage/sessionStorage
public config files
screenshots
chat messages
```

## Server-side Access Pattern

```js
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY missing");
}
```

## Santis Rule

Frontend yalnızca kendi backend endpoint’iyle konuşur.
Backend, `.env` or secret manager üzerinden anahtarı okur.
OpenAI/OpenRouter/Claude gibi dış servis çağrıları sadece server-side katmanda yapılır.

## Environment Audit Redaction Rule

Environment audit çıktıları hiçbir zaman raw secret değeri yazdırmamalıdır.

Allowed:
- OPENAI_API_KEY=SET
- OPENAI_API_KEY=MISSING
- OPENAI_API_KEY=REDACTED

Forbidden:
- OPENAI_API_KEY=sk-...
- herhangi bir token’ın ilk/son karakterlerini göstermek
