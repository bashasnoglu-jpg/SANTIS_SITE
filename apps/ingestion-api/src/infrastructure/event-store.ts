import { appendFile, mkdir } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import * as readline from "readline";
import * as path from "path";
import { SantisEvent } from "../../../../packages/event-dictionary/src/index.js";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "sovereign-events.jsonl");

export const EventStore = {
  /**
   * 1. KAYIT (Append): Olayı silinmez deftere yazar.
   */
  async append(event: SantisEvent): Promise<void> {
    if (!existsSync(STORE_DIR)) {
      await mkdir(STORE_DIR, { recursive: true });
    }
    // Her event tek bir satır olarak (JSON Line) kaydedilir.
    const logLine = JSON.stringify(event) + "\n";
    await appendFile(STORE_FILE, logLine, "utf-8");
  },

  /**
   * 2. ZAMANDA YOLCULUK (Replay): Tüm geçmişi okur ve projeksiyonları yeniden kurar.
   */
  async replay(hydrator: (event: SantisEvent) => void): Promise<number> {
    if (!existsSync(STORE_FILE)) {
      console.log("📭 [Event Store] Geçmiş kayıt bulunamadı. Temiz sayfa açılıyor.");
      return 0;
    }

    console.log("⏪ [Event Store] Akaşik Kayıtlar okunuyor... Zamanda yolculuk başlatıldı.");
    let eventCount = 0;
    const start = performance.now();

    const fileStream = createReadStream(STORE_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.trim() === "") continue;
      try {
        const event = JSON.parse(line) as SantisEvent;
        // Olayı al ve doğrudan projeksiyon işçilerine ver (Side-effect tetiklemeden!)
        hydrator(event);
        eventCount++;
      } catch (error) {
        console.error("🚨 [Event Store] Bozuk zaman çizgisi satırı atlandı:", error);
      }
    }

    const duration = (performance.now() - start).toFixed(2);
    console.log(`✅ [Event Store] ${eventCount} olay ${duration}ms içinde başarıyla re-hidrate edildi!`);
    return eventCount;
  }
};
