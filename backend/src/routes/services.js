const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/v1/services
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req;

        // Critical: V10 SaaS Isolation enforces where hotel_id = tenantId
        const query = 'SELECT * FROM services WHERE hotel_id = $1 AND is_active = true';
        const result = await pool.query(query, [tenantId]);

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('[Services API Error]', error);
        res.status(500).json({ error: 'Internal server error while fetching services.' });
    }
});

// POST /api/v1/services (Admin Only usually)
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req;
        const { name, category, duration_min, price } = req.body;

        const query = `
            INSERT INTO services (hotel_id, name, category, duration_min, price) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const result = await pool.query(query, [tenantId, name, category, duration_min, price]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[Services API Error]', error);
        res.status(500).json({ error: 'Failed to create service.' });
    }
});

module.exports = router;
