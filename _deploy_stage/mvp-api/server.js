const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.POSTGRES_USER || "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    database: process.env.POSTGRES_DB || "santis",
    password: process.env.POSTGRES_PASSWORD || "1234",
    port: 5432
});

const app = express();

// Security & Logging Middlewares
app.use(helmet());
app.use(morgan("dev"));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: "Too many requests, please try again later." }
});
// app.use(limiter);

app.use(express.json());
app.use(cors());

// Global UTF-8 Header Middleware
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
});

app.get("/", (req, res) => {
    res.send("SANTIS MVP API RUNNING");
});

// GET /hq/hotels - Fetch real DB data for Command Center
app.get("/hq/hotels", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM hotels ORDER BY created_at DESC LIMIT 50");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /hq/global-stats - Live Command Center Stats
app.get("/hq/global-stats", async (req, res) => {
    try {
        const revResult = await pool.query("SELECT COALESCE(SUM(price_snapshot), 0) as total_revenue, COUNT(id) as total_bookings FROM bookings");
        const hotelResult = await pool.query("SELECT COUNT(*) as total_hotels FROM tenants");
        const tenantResult = await pool.query("SELECT COUNT(*) as total_tenants FROM tenants");

        // Dynamic Regions based on active hotels
        const regionsResult = await pool.query("SELECT country as region, COUNT(id) as hotel_count, 15000 as regional_revenue FROM tenants WHERE country IS NOT NULL GROUP BY country");

        res.json({
            network: {
                total_tenants: parseInt(tenantResult.rows[0].total_tenants) || 0,
                total_hotels: parseInt(hotelResult.rows[0].total_hotels) || 0
            },
            performance: {
                today_revenue: parseFloat(revResult.rows[0].total_revenue) || 0,
                today_bookings: parseInt(revResult.rows[0].total_bookings) || 0
            },
            regions: regionsResult.rows.map(r => ({
                region: r.region,
                hotel_count: parseInt(r.hotel_count),
                regional_revenue: parseFloat(r.regional_revenue)
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /hq/live-feed - Global booking feed for HQ
app.get("/hq/live-feed", async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, 
                'WALK-IN' as room_number,
                r.price_snapshot as price_charged, 
                r.status, 
                TO_CHAR(r.start_time, 'HH24:MI') as booked_at,
                h.name as hotel_name, 
                s.name as service_name
            FROM bookings r
            JOIN tenants h ON r.tenant_id = h.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
            LIMIT 10
        `;
        const result = await pool.query(query);
        res.json({ feed: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MULTI-TENANT & ROTA YAPILARI
// ==========================================

// GET /tenant/dashboard
app.get("/tenant/dashboard", async (req, res) => {
    try {
        const hotelIdParam = req.query.hotel_id;
        const tenantQuery = hotelIdParam ? hotelIdParam : "1";

        const hotelResult = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantQuery]);
        if (hotelResult.rows.length === 0) return res.status(404).json({ error: "Hotel not found" });


        const reservationsResult = await pool.query("SELECT * FROM bookings WHERE tenant_id = $1 ORDER BY start_time ASC LIMIT 20", [tenantQuery]);
        const servicesResult = await pool.query("SELECT * FROM services");

        res.json({
            hotel: hotelResult.rows[0],
            reservations: reservationsResult.rows,
            services: servicesResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get("/ai/predict-offer/:hotelSlug", async (req, res) => {
    try {
        const { hotelSlug } = req.params;
        res.json({
            hotel: hotelSlug,
            offerType: "Upsell",
            recommendedService: "VIP SPA Deep Tissue",
            discountAITolerance: 15,
            predictedConversion: 82.4
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /services/:hotelId
app.get("/services/:hotelId", async (req, res) => {
    try {
        const { hotelId } = req.params;
        const result = await pool.query("SELECT * FROM services WHERE hotel_id = $1", [hotelId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /reservation
app.post("/reservation", async (req, res) => {
    try {
        const { hotel_id, service_id, guest_name, reservation_time } = req.body;
        const result = await pool.query(
            "INSERT INTO reservations (hotel_id, service_id, guest_name, time_slot, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [hotel_id, service_id, guest_name, reservation_time]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /hq/hotels - Allow HQ Dashboard to Deploy New Nodes (Hotels)
app.post("/hq/hotels", async (req, res) => {
    try {
        const { name, brand_slug, city, total_spider_nodes, operating_model, demo_target, rev_share_pct } = req.body;

        // 1. Insert Hotel
        const hotelResult = await pool.query(
            `INSERT INTO hotels (name, brand_slug, city) VALUES ($1, $2, $3) RETURNING id`,
            [name, brand_slug, city]
        );
        const newHotelId = hotelResult.rows[0].id;

        // 2. Insert Operating Contract with defaults
        await pool.query(
            `INSERT INTO operating_contracts (hotel_id, contract_type, revenue_share_pct, performance_target_monthly)
             VALUES ($1, $2, $3, $4)`,
            [newHotelId, operating_model, rev_share_pct, 100000]
        );

        res.status(201).json({ message: "NODE DEPLOYED", hotel_id: newHotelId });
    } catch (err) {
        console.error("Deploy Hotel Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SANTIS MASTER HQ] API Engine active on port ${PORT}`);
});




