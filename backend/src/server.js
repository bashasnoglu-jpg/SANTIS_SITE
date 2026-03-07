require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test DB Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('[DB] Error acquiring client', err.stack);
    }
    console.log('[DB] PostgreSQL successfully connected.');
    release();
});

// Basic Health Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ACTIVE',
        version: 'V8 Master OS',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/v1/services', require('./routes/services'));
app.use('/api/v1/reservations', require('./routes/reservations'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`[Omni-OS Engine] Server running efficiently on port ${PORT}`);
});
