// server/santis-slot-engine.js
import express from 'express';
import cors from 'cors';
import { dbVault } from './santis-db-vault.js';

const app = express();
app.use(cors());
app.use(express.json());

// 1. İSTASYON: Slot Çözücü (Slot Resolver)
// Frontend belirli bir asset Public ID'sini hardcode etmek yerine "SovereignSlot" (Örn: HERO_HOME) ister.
app.get('/api/v1/media/slot/:slotName', async (req, res) => {
    try {
        const { slotName } = req.params;
        const tenantId = req.query.tenantId || 'tn_santis_club'; // Default Tenant

        // Yayınlanmış (Published) ve geçerli tarih aralığındaki en yüksek öncelikli asset public id'yi çeken zeki sorgu
        const resolveQuery = `
            SELECT b.slot_name, m.public_id, b.preset_policy
            FROM sovereign_slot_bindings b
            JOIN sovereign_media_registry m ON b.asset_id = m.asset_id
            WHERE b.slot_name = $1 
              AND b.tenant_id = $2 
              AND b.is_published = TRUE
              AND (b.starts_at IS NULL OR b.starts_at <= NOW())
              AND (b.ends_at IS NULL OR b.ends_at >= NOW())
            ORDER BY b.priority DESC, b.starts_at DESC
            LIMIT 1;
        `;

        const { rows } = await dbVault.query(resolveQuery, [slotName, tenantId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Bu slot için aktif bir yayın (Binding) bulunamadı.' });
        }

        const { public_id, preset_policy } = rows[0];

        // Semantic Preset kurallarına göre dinamik URL matriksini örüyoruz
        res.json({
            slot: slotName,
            asset: { publicId: public_id },
            urls: {
                hero: `/media/hero/${public_id}`,
                mobileHero: `/media/mobile-hero/${public_id}`,
                card: `/media/card/${public_id}`,
                thumb: `/media/thumb/${public_id}`
            }
        });

    } catch (error) {
        console.error('[SLOT ENGINE] Resolver Hatası:', error);
        res.status(500).json({ error: 'Slot Resolution Failed.' });
    }
});

// 2. İSTASYON: Slot Bağlayıcı (Admin Panel Binding)
app.post('/api/v1/media/slot/bind', async (req, res) => {
    try {
        const { tenantId, slotName, assetId, presetPolicy, isPublished, priority } = req.body;

        if (!slotName || !assetId) {
            return res.status(400).json({ error: 'Eksik Slot veya Asset parametreleri.' });
        }

        const upsertQuery = `
            INSERT INTO sovereign_slot_bindings (tenant_id, slot_name, asset_id, preset_policy, is_published, priority)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE 
            SET asset_id = EXCLUDED.asset_id,
                preset_policy = EXCLUDED.preset_policy,
                is_published = EXCLUDED.is_published,
                priority = EXCLUDED.priority
            RETURNING id;
        `;

        await dbVault.query(upsertQuery, [
            tenantId || 'tn_santis_club',
            slotName,
            assetId,
            presetPolicy || 'mixed',
            isPublished ?? true,
            priority || 0
        ]);

        console.log(`[SLOT ENGINE] Asset [${assetId}] başarıyla [${slotName}] slotuna bağlandı.`);

        // Slot.published event yayınlaması burada yapılabilir (WebSocket vb.)

        res.json({ status: 'BIND_SUCCESS', slotName, assetId });

    } catch (error) {
        console.error('[SLOT ENGINE] Binding Hatası:', error);
        res.status(500).json({ error: 'Binding Failed.' });
    }
});

const PORT = 5051;
app.listen(PORT, () => {
    console.log(`[SOVEREIGN CORE] Slot Engine (Port ${PORT}) aktif. Matrix arayüzüne hükmediyor. 🎯`);
});
