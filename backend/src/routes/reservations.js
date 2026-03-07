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

// POST /api/v1/reservations
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req;
        const { guest_id, service_id, staff_id, date_time, price_charged, notes } = req.body;

        // V10 Enterprise Logic: 
        // PostgreSQL handles unique constraints on (staff_id, date_time). 
        // If it throws an error (e.g. Code 23505), we catch double booking.

        const query = `
            INSERT INTO reservations 
            (hotel_id, guest_id, service_id, staff_id, date_time, price_charged, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;

        const result = await pool.query(query, [
            tenantId, guest_id, service_id, staff_id, date_time, price_charged, notes
        ]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Postgres Unique Violation
            return res.status(409).json({ error: 'Conflict: This time slot is already booked for this staff/room.' });
        }
        console.error('[Reservations API Error]', error);
        res.status(500).json({ error: 'Failed to create reservation.' });
    }
});

// GET /api/v1/reservations
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req;

        // Return only the current hotel's reservations, protecting visibility
        const query = 'SELECT * FROM reservations WHERE hotel_id = $1 ORDER BY date_time ASC';
        const result = await pool.query(query, [tenantId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error while fetching reservations.' });
    }
});

module.exports = router;
