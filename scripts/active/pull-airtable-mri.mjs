import fs from 'fs';
import path from 'path';

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID || 'app7VPfdgji5FzLHg';

if (!pat) {
  console.error("Missing required environment variable: AIRTABLE_PAT");
  process.exit(1);
}

async function fetchSchema() {
  console.log(`Santis OS Airtable MR (Schema) çekiliyor...`);
  console.log(`Base ID: ${baseId}`);

  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${pat}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Airtable Meta API Hatası: ${res.status} ${res.statusText}`);
    console.error(`Detay: ${errText}`);
    process.exit(1);
  }

  const data = await res.json();
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputPath = path.join(reportsDir, 'santis_os_airtable_mri.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`\n✅ MR (Schema) başarıyla çekildi!`);
  console.log(`📂 Toplam Tablo Sayısı: ${data.tables.length}`);
  console.log(`💾 Kayıt Yeri: ${outputPath}`);
  
  // Basit bir özet yazdır
  console.log('\n--- TABLO ÖZETİ ---');
  data.tables.forEach(t => {
    console.log(`- ${t.name} (${t.fields.length} alan, ${t.views.length} görünüm)`);
  });
}

fetchSchema().catch(err => {
  console.error("Beklenmeyen Hata:", err);
  process.exit(1);
});
