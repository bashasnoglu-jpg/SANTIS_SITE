const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Sadece bu dosyalardaki RAW_HEX'leri "var(--...)" veya "chartTheme" ile değiştireceğiz.
const replacements = [
  { from: /#c6a96b/gi, to: 'var(--sovereign-gold)' },
  { from: /#141416/gi, to: 'var(--sovereign-dark)' },
  { from: /#e5e5ea/gi, to: 'var(--sovereign-neutral-200)' },
  { from: /#ff3b30/gi, to: 'var(--sovereign-danger)' },
  { from: /#8E8E93/gi, to: 'var(--sovereign-muted)' },
  { from: /#50C878/gi, to: 'var(--sovereign-success)' },
  { from: /#2A2624/gi, to: 'var(--sovereign-panel)' },
  { from: /#e0c98f/gi, to: 'var(--sovereign-sand)' }, // tahmini SovereignAura için
  { from: /#fff5f5/gi, to: 'var(--sovereign-dark)' }, // OpsAnomalyBanner
  { from: /#ddd\b/gi, to: 'var(--sovereign-neutral-300)' },
  { from: /#fff\b/gi, to: 'var(--sovereign-surface)' },
  { from: /#d97706/gi, to: 'var(--sovereign-warning)' },
  { from: /#fff7ed/gi, to: 'var(--sovereign-surface)' }, // OpsPolicyBanner
  { from: /#f8fafc/gi, to: 'var(--sovereign-dark)' },
  { from: /#eee\b/gi, to: 'var(--sovereign-neutral-200)' },
  { from: /#666\b/gi, to: 'var(--sovereign-neutral-600)' },
  { from: /#ccc\b/gi, to: 'var(--sovereign-neutral-400)' },
  { from: /#10b981/gi, to: 'var(--sovereign-success)' },
  { from: /#059669/gi, to: 'var(--sovereign-success-deep)' },
  { from: /#d4af37/gi, to: 'var(--sovereign-gold-strong)' },
  { from: /#222\b/gi, to: 'var(--sovereign-graphite)' },
  { from: /#0a0a0b/gi, to: 'var(--sovereign-black)' },
  
  // Tailwind Arbitrary text-[] -> token class
  { from: /text-\[#141416\]/g, to: 'text-sovereign-dark' },
  { from: /text-\[10px\]/g, to: 'text-2xs' },

  // Tailwind Arbitrary shadows -> fx utilities
  { from: /shadow-\[0_0_40px_rgba\(39,39,42,0\.15\)\]/g, to: 'fx-shadow-panel' },
  { from: /shadow-\[0_0_35px_rgba\(197,160,89,0\.12\)\]/g, to: 'fx-glow-medium-gold' },
  { from: /shadow-\[0_12px_48px_0_rgba\(44,44,44,0\.08\)\]/g, to: 'fx-shadow-panel' },

  // Layout Fixes
  { from: /min-w-\[300px\]/g, to: 'layout-minw-300' },
  { from: /h-\[30px\]/g, to: 'layout-h-30px' },
  { from: /h-\[300px\]/g, to: 'layout-h-300' }
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.match(/\.(js|jsx|ts|tsx)$/)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      replacements.forEach(r => {
        content = content.replace(r.from, r.to);
      });
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(path.join(ROOT, 'admin-panel', 'src'));
console.log('Final pass done.');
