# SANTIS OS v3 — Component Colocation Yapısı

Her UI birimi kendi klasöründe: şablon (html), mantık (js), stil (css).
Kernel bu component'leri otomatik lazy-load eder.

## Kullanım
```js
// Kernel'de:
resolveModule('component:reservation-card')

// Veya doğrudan:
import { init } from '/components/reservation-card/reservation-card.js';
init();
```

## Component'i HTML'e ekle
```html
<div data-component="reservation-card" data-service-id="hammam-ritual"></div>
```

Kernel'deki ComponentLoader (interaction-engine.js) [data-component] attribute'larını
otomatik tarar ve ilgili component.js'i lazy-load eder.
