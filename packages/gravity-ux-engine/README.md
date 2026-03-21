# UX Gravity Engine

> Predict e-commerce conversion rates **before deployment** using AI behavioral physics.

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-3.0.0-gold)

## What is this?

UX Gravity Engine simulates thousands of AI-driven virtual visitors against your product layout. Each bot has a distinct neuro-cognitive persona (VIP, Impulse, Observer, Bargain). Products act as gravitational bodies — the engine predicts which layouts convert and which don't.

**No more A/B testing. No more guessing. Simulate the future.**

## Quick Start

```bash
# Open the demo directly in your browser
open demo/3-card-arena.html

# Or serve locally
npx serve . -l 3000
```

## Architecture

```
src/
├── core/           → Spatial Hash Grid + Gravity Physics (O(n))
├── ai-personas/    → 4 Neuro-Cognitive Bot Profiles
└── renderer/       → Canvas Heatmap + Live Analytics

demo/
└── 3-card-arena.html  → Investor Demo (Bad vs AI Layout)

pitch-deck/
└── architecture_paper.md  → Technical Whitepaper
```

## Performance

| Metric | Value |
|--------|-------|
| 10,000 bots | 60 FPS |
| 50,000 bots | 60 FPS (Spatial Hash) |
| Memory | < 50MB |
| Algorithm | O(n) |

## License

MIT
